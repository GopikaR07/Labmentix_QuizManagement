const pool = require("../config/database");

// Small helper: validate the options array shape before touching the DB.
// Expects: [{ option_text: "...", is_correct: true|false }, ...]
// Requires 2-6 options with exactly one correct answer.
const validateOptions = (options) => {

    if (!Array.isArray(options) || options.length < 2) {
        return "A question needs at least 2 options";
    }

    if (options.length > 6) {
        return "A question can have at most 6 options";
    }

    const correctCount = options.filter((o) => o.is_correct === true).length;

    if (correctCount !== 1) {
        return "Exactly one option must be marked as correct";
    }

    for (const o of options) {
        if (!o.option_text || !o.option_text.trim()) {
            return "Every option needs text";
        }
    }

    return null;
};

// Add Question with its options (admin only)
// POST /api/quizzes/:quizId/questions
const addQuestion = async (req, res) => {

    const client = await pool.connect();

    try {

        const { quizId } = req.params;
        const { question_text, marks, explanation, difficulty, options } = req.body;

        if (!question_text || !question_text.trim()) {
            return res.status(400).json({ message: "Question text is required" });
        }

        const optionError = validateOptions(options);
        if (optionError) {
            return res.status(400).json({ message: optionError });
        }

        const quizCheck = await client.query(
            "SELECT id FROM quizzes WHERE id = $1",
            [quizId]
        );

        if (quizCheck.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        await client.query("BEGIN");

        const questionResult = await client.query(
            `INSERT INTO questions (quiz_id, question_text, marks, explanation, difficulty)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                quizId,
                question_text,
                marks || 1,
                explanation || null,
                difficulty || "BEGINNER"
            ]
        );

        const question = questionResult.rows[0];

        const insertedOptions = [];

        for (const opt of options) {
            const optResult = await client.query(
                `INSERT INTO options (question_id, option_text, is_correct)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [question.id, opt.option_text, !!opt.is_correct]
            );
            insertedOptions.push(optResult.rows[0]);
        }

        await client.query("COMMIT");

        res.status(201).json({ ...question, options: insertedOptions });

    } catch (err) {

        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Server Error" });

    } finally {
        client.release();
    }
};

// Get Questions of a Quiz (admin only — includes correct answers,
// which is exactly why this is not exposed to students. The student
// quiz-taking endpoint, built separately, will return questions
// WITHOUT is_correct.)
// GET /api/quizzes/:quizId/questions
const getQuestions = async (req, res) => {

    try {

        const { quizId } = req.params;

        const questions = await pool.query(
            "SELECT * FROM questions WHERE quiz_id = $1 ORDER BY id",
            [quizId]
        );

        const options = await pool.query(
            `SELECT o.* FROM options o
             JOIN questions q ON q.id = o.question_id
             WHERE q.quiz_id = $1
             ORDER BY o.id`,
            [quizId]
        );

        const grouped = questions.rows.map((q) => ({
            ...q,
            options: options.rows.filter((o) => o.question_id === q.id)
        }));

        res.json(grouped);

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

// Update Question + replace its options (admin only)
// PUT /api/questions/:id
const updateQuestion = async (req, res) => {

    const client = await pool.connect();

    try {

        const { id } = req.params;
        const { question_text, marks, explanation, difficulty, options } = req.body;

        if (!question_text || !question_text.trim()) {
            return res.status(400).json({ message: "Question text is required" });
        }

        const optionError = validateOptions(options);
        if (optionError) {
            return res.status(400).json({ message: optionError });
        }

        await client.query("BEGIN");

        const questionResult = await client.query(
            `UPDATE questions
             SET question_text = $1, marks = $2, explanation = $3, difficulty = $4
             WHERE id = $5
             RETURNING *`,
            [question_text, marks || 1, explanation || null, difficulty || "BEGINNER", id]
        );

        if (questionResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Question Not Found" });
        }

        // Simplest correct approach: drop old options, insert the new set.
        // (Existing student answers reference options by id with ON DELETE
        // SET NULL, so past attempt history isn't corrupted — but note this
        // means editing options after students have attempted the quiz will
        // null out their selected_option_id for this question.)
        await client.query("DELETE FROM options WHERE question_id = $1", [id]);

        const insertedOptions = [];
        for (const opt of options) {
            const optResult = await client.query(
                `INSERT INTO options (question_id, option_text, is_correct)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [id, opt.option_text, !!opt.is_correct]
            );
            insertedOptions.push(optResult.rows[0]);
        }

        await client.query("COMMIT");

        res.json({ ...questionResult.rows[0], options: insertedOptions });

    } catch (err) {

        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Server Error" });

    } finally {
        client.release();
    }
};

// Delete Question (admin only)
// DELETE /api/questions/:id
const deleteQuestion = async (req, res) => {

    try {

        const result = await pool.query(
            "DELETE FROM questions WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Question Not Found" });
        }

        res.json({ message: "Question Deleted Successfully" });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }

};

module.exports = {
    addQuestion,
    getQuestions,
    updateQuestion,
    deleteQuestion
};
