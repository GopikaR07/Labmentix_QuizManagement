const pool = require("../config/database");

// Get all quiz attempts across all students (admin only)
// GET /api/admin/attempts
// Optional filters: ?quiz_id=  ?user_id=  ?status=PASSED|FAILED|IN_PROGRESS
const getAllAttempts = async (req, res) => {
    try {

        const { quiz_id, user_id, status } = req.query;

        const conditions = [];
        const values = [];

        if (quiz_id) {
            values.push(quiz_id);
            conditions.push(`a.quiz_id = $${values.length}`);
        }

        if (user_id) {
            values.push(user_id);
            conditions.push(`a.user_id = $${values.length}`);
        }

        if (status) {
            values.push(status);
            conditions.push(`a.status = $${values.length}`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const attempts = await pool.query(
            `SELECT a.*, q.title AS quiz_title, u.name AS student_name, u.email AS student_email
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             JOIN users u ON u.id = a.user_id
             ${whereClause}
             ORDER BY a.started_at DESC`,
            values
        );

        res.json(attempts.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get full detail + review for a single attempt (admin only)
// GET /api/admin/attempts/:id
const getAttemptDetail = async (req, res) => {
    try {

        const attemptResult = await pool.query(
            `SELECT a.*, q.title AS quiz_title, q.passing_score,
                    u.name AS student_name, u.email AS student_email
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             JOIN users u ON u.id = a.user_id
             WHERE a.id = $1`,
            [req.params.id]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ message: "Attempt Not Found" });
        }

        const review = await pool.query(
            `SELECT ans.question_id, q.question_text, q.explanation,
                    ans.selected_option_id, selopt.option_text AS selected_option_text,
                    ans.is_correct,
                    correctopt.id AS correct_option_id, correctopt.option_text AS correct_option_text
             FROM answers ans
             JOIN questions q ON q.id = ans.question_id
             LEFT JOIN options selopt ON selopt.id = ans.selected_option_id
             LEFT JOIN options correctopt ON correctopt.question_id = ans.question_id AND correctopt.is_correct = TRUE
             WHERE ans.attempt_id = $1
             ORDER BY ans.question_id`,
            [req.params.id]
        );

        res.json({ ...attemptResult.rows[0], review: review.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Platform-wide analytics for the admin dashboard (admin only)
// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
    try {

        const statsResult = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'STUDENT') AS total_students,
                (SELECT COUNT(*) FROM quizzes) AS total_quizzes,
                (SELECT COUNT(*) FROM quizzes WHERE status = 'PUBLISHED') AS published_quizzes,
                (SELECT COUNT(*) FROM quizzes WHERE status = 'DRAFT') AS draft_quizzes,
                (SELECT COUNT(*) FROM questions) AS total_questions,
                (SELECT COUNT(*) FROM attempts WHERE status IN ('PASSED','FAILED')) AS total_attempts,
                (SELECT COALESCE(AVG(percentage), 0) FROM attempts WHERE status IN ('PASSED','FAILED')) AS average_score,
                (SELECT COUNT(*) FROM attempts WHERE status = 'PASSED') AS total_passed,
                (SELECT COUNT(*) FROM attempts WHERE status = 'FAILED') AS total_failed
        `);

        // Quiz attempts over the last 14 days
        const attemptsOverTime = await pool.query(`
            SELECT DATE(started_at) AS date, COUNT(*) AS count
            FROM attempts
            WHERE started_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(started_at)
            ORDER BY date
        `);

        // Student registrations over the last 14 days
        const registrationsOverTime = await pool.query(`
            SELECT DATE(created_at) AS date, COUNT(*) AS count
            FROM users
            WHERE role = 'STUDENT' AND created_at >= NOW() - INTERVAL '14 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        const passFailRatio = await pool.query(`
            SELECT status, COUNT(*) AS count
            FROM attempts
            WHERE status IN ('PASSED','FAILED')
            GROUP BY status
        `);

        const mostPopularQuizzes = await pool.query(`
            SELECT q.id, q.title, COUNT(a.id) AS attempt_count, COALESCE(AVG(a.percentage), 0) AS average_score
            FROM quizzes q
            JOIN attempts a ON a.quiz_id = q.id AND a.status IN ('PASSED','FAILED')
            GROUP BY q.id, q.title
            ORDER BY attempt_count DESC
            LIMIT 5
        `);

        const mostPopularCategories = await pool.query(`
            SELECT c.id, c.name, COUNT(a.id) AS attempt_count
            FROM categories c
            JOIN quizzes q ON q.category_id = c.id
            JOIN attempts a ON a.quiz_id = q.id AND a.status IN ('PASSED','FAILED')
            GROUP BY c.id, c.name
            ORDER BY attempt_count DESC
            LIMIT 5
        `);

        const stats = statsResult.rows[0];

        res.json({
            stats: {
                total_students: parseInt(stats.total_students, 10),
                total_quizzes: parseInt(stats.total_quizzes, 10),
                published_quizzes: parseInt(stats.published_quizzes, 10),
                draft_quizzes: parseInt(stats.draft_quizzes, 10),
                total_questions: parseInt(stats.total_questions, 10),
                total_attempts: parseInt(stats.total_attempts, 10),
                average_score: parseFloat(parseFloat(stats.average_score).toFixed(2)),
                total_passed: parseInt(stats.total_passed, 10),
                total_failed: parseInt(stats.total_failed, 10)
            },
            charts: {
                attempts_over_time: attemptsOverTime.rows,
                registrations_over_time: registrationsOverTime.rows,
                pass_fail_ratio: passFailRatio.rows,
                most_popular_quizzes: mostPopularQuizzes.rows,
                most_popular_categories: mostPopularCategories.rows
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getAllAttempts,
    getAttemptDetail,
    getAnalytics
};
