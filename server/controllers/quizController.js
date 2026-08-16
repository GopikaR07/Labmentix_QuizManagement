const pool = require("../config/database");

const ALLOWED_STATUS = ["DRAFT", "PUBLISHED", "UNPUBLISHED"];

// Create Quiz (admin only) — always starts as DRAFT regardless of what's sent,
// so a quiz can never accidentally go live before questions are added.
const createQuiz = async (req, res) => {
    try {

        const {
            title,
            description,
            category_id,
            difficulty,
            duration,
            passing_score,
            max_attempts,
            thumbnail_url
        } = req.body;

        if (!title || !duration) {
            return res.status(400).json({ message: "Title and duration are required" });
        }

        const quiz = await pool.query(
            `INSERT INTO quizzes
                (title, description, category_id, difficulty, duration,
                 passing_score, max_attempts, thumbnail_url, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'DRAFT',$9)
             RETURNING *`,
            [
                title,
                description || null,
                category_id || null,
                difficulty || "BEGINNER",
                duration,
                passing_score || 60,
                max_attempts || 1,
                thumbnail_url || null,
                req.user.id
            ]
        );

        res.status(201).json(quiz.rows[0]);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }
};

const ALLOWED_DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

// Get All Quizzes
// - Students only ever see PUBLISHED quizzes.
// - Admins see everything, and can filter with ?status=DRAFT/PUBLISHED/UNPUBLISHED
// - Both can filter with ?category_id=, ?difficulty=, search with ?search=,
//   and sort with ?sort=recent (default) | popular
const getAllQuizzes = async (req, res) => {

    try {

        const { status, category_id, difficulty, search, sort } = req.query;

        const conditions = [];
        const values = [];

        if (req.user.role === "ADMIN") {
            if (status) {
                if (!ALLOWED_STATUS.includes(status)) {
                    return res.status(400).json({ message: "Invalid status filter" });
                }
                values.push(status);
                conditions.push(`q.status = $${values.length}`);
            }
        } else {
            // Students can never see non-published quizzes
            conditions.push(`q.status = 'PUBLISHED'`);
        }

        if (category_id) {
            values.push(category_id);
            conditions.push(`q.category_id = $${values.length}`);
        }

        if (difficulty) {
            if (!ALLOWED_DIFFICULTY.includes(difficulty)) {
                return res.status(400).json({ message: "Invalid difficulty filter" });
            }
            values.push(difficulty);
            conditions.push(`q.difficulty = $${values.length}`);
        }

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`q.title ILIKE $${values.length}`);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        // "Popularity" = number of completed attempts on the quiz.
        const orderClause = sort === "popular"
            ? `ORDER BY attempt_count DESC, q.created_at DESC`
            : `ORDER BY q.created_at DESC`;

        const quizzes = await pool.query(
            `SELECT q.*, c.name AS category_name,
                    (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count,
                    (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id AND status IN ('PASSED','FAILED')) AS attempt_count
             FROM quizzes q
             LEFT JOIN categories c ON c.id = q.category_id
             ${whereClause}
             ${orderClause}`,
            values
        );

        res.json(quizzes.rows);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

// Get Quiz By ID
// Students get a 404 (not a 403) for non-published quizzes so drafts aren't
// even discoverable by guessing IDs.
const getQuizById = async (req, res) => {

    try {

        const quiz = await pool.query(
            `SELECT q.*, c.name AS category_name,
                    (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) AS question_count
             FROM quizzes q
             LEFT JOIN categories c ON c.id = q.category_id
             WHERE q.id = $1`,
            [req.params.id]
        );

        if (quiz.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        const found = quiz.rows[0];

        if (req.user.role !== "ADMIN" && found.status !== "PUBLISHED") {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        res.json(found);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

// Update Quiz (admin only)
const updateQuiz = async (req, res) => {

    try {

        const {
            title,
            description,
            category_id,
            difficulty,
            duration,
            passing_score,
            max_attempts,
            thumbnail_url
        } = req.body;

        const quiz = await pool.query(

            `UPDATE quizzes
             SET title = $1,
                 description = $2,
                 category_id = $3,
                 difficulty = $4,
                 duration = $5,
                 passing_score = $6,
                 max_attempts = $7,
                 thumbnail_url = $8,
                 updated_at = NOW()
             WHERE id = $9
             RETURNING *`,

            [
                title,
                description || null,
                category_id || null,
                difficulty || "BEGINNER",
                duration,
                passing_score || 60,
                max_attempts || 1,
                thumbnail_url || null,
                req.params.id
            ]

        );

        if (quiz.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        res.json(quiz.rows[0]);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

// Publish / unpublish / revert-to-draft a quiz (admin only)
// PATCH /api/quizzes/:id/publish   body: { status: "PUBLISHED" | "UNPUBLISHED" | "DRAFT" }
const setQuizStatus = async (req, res) => {

    try {

        const { status } = req.body;

        if (!ALLOWED_STATUS.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${ALLOWED_STATUS.join(", ")}`
            });
        }

        // Guard rail: don't let a quiz go live with zero questions
        if (status === "PUBLISHED") {
            const questionCount = await pool.query(
                "SELECT COUNT(*) FROM questions WHERE quiz_id = $1",
                [req.params.id]
            );

            if (parseInt(questionCount.rows[0].count, 10) === 0) {
                return res.status(400).json({
                    message: "Cannot publish a quiz with no questions"
                });
            }
        }

        const quiz = await pool.query(
            `UPDATE quizzes
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, req.params.id]
        );

        if (quiz.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        res.json(quiz.rows[0]);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

// Delete Quiz (admin only)
const deleteQuiz = async (req, res) => {

    try {

        const result = await pool.query(
            "DELETE FROM quizzes WHERE id=$1 RETURNING id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        res.json({
            message: "Quiz Deleted Successfully"
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

module.exports = {
    createQuiz,
    getAllQuizzes,
    getQuizById,
    updateQuiz,
    setQuizStatus,
    deleteQuiz
};
