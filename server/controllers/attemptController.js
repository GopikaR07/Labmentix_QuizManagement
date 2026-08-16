const pool = require("../config/database");

// Start a quiz attempt (student)
// POST /api/quizzes/:quizId/start
// - Quiz must exist and be PUBLISHED
// - Enforces max_attempts per user
// - Blocks starting a second attempt while one is already IN_PROGRESS
// - Returns the questions WITHOUT is_correct / explanation, so the
//   frontend never has the answer key sitting in the browser.
const startAttempt = async (req, res) => {
    try {

        const { quizId } = req.params;
        const userId = req.user.id;

        const quizResult = await pool.query(
            "SELECT * FROM quizzes WHERE id = $1",
            [quizId]
        );

        if (quizResult.rows.length === 0) {
            return res.status(404).json({ message: "Quiz Not Found" });
        }

        const quiz = quizResult.rows[0];

        if (quiz.status !== "PUBLISHED") {
            return res.status(400).json({ message: "This quiz is not available" });
        }

        const inProgress = await pool.query(
            `SELECT id FROM attempts
             WHERE quiz_id = $1 AND user_id = $2 AND status = 'IN_PROGRESS'`,
            [quizId, userId]
        );

        if (inProgress.rows.length > 0) {
            return res.status(400).json({
                message: "You already have an attempt in progress for this quiz",
                attempt_id: inProgress.rows[0].id
            });
        }

        const completedCount = await pool.query(
            `SELECT COUNT(*) FROM attempts
             WHERE quiz_id = $1 AND user_id = $2 AND status IN ('PASSED','FAILED')`,
            [quizId, userId]
        );

        if (parseInt(completedCount.rows[0].count, 10) >= quiz.max_attempts) {
            return res.status(400).json({ message: "Maximum attempts reached for this quiz" });
        }

        const questionsResult = await pool.query(
            "SELECT id, question_text, marks, difficulty FROM questions WHERE quiz_id = $1 ORDER BY id",
            [quizId]
        );

        if (questionsResult.rows.length === 0) {
            return res.status(400).json({ message: "This quiz has no questions yet" });
        }

        const optionsResult = await pool.query(
            `SELECT o.id, o.question_id, o.option_text
             FROM options o
             JOIN questions q ON q.id = o.question_id
             WHERE q.quiz_id = $1
             ORDER BY o.id`,
            [quizId]
        );

        const questions = questionsResult.rows.map((q) => ({
            ...q,
            options: optionsResult.rows.filter((o) => o.question_id === q.id)
        }));

        const attempt = await pool.query(
            `INSERT INTO attempts (quiz_id, user_id, status, started_at)
             VALUES ($1, $2, 'IN_PROGRESS', NOW())
             RETURNING *`,
            [quizId, userId]
        );

        res.status(201).json({
            attempt_id: attempt.rows[0].id,
            quiz: {
                id: quiz.id,
                title: quiz.title,
                duration: quiz.duration,
                passing_score: quiz.passing_score
            },
            started_at: attempt.rows[0].started_at,
            questions
        });

    } catch (err) {

        console.error(err);
        res.status(500).json({ message: "Server Error" });

    }
};

// Submit a quiz attempt (student)
// POST /api/quizzes/:quizId/submit
// body: { attempt_id, answers: [{ question_id, selected_option_id | null }] }
//
// Scoring happens entirely server-side against the DB's is_correct flags —
// the frontend never sends or sees correct answers before this point, so a
// student can't manipulate their score through client-side code.
const submitAttempt = async (req, res) => {

    const client = await pool.connect();

    try {

        const { quizId } = req.params;
        const { attempt_id, answers } = req.body;
        const userId = req.user.id;

        if (!attempt_id || !Array.isArray(answers)) {
            return res.status(400).json({ message: "attempt_id and answers[] are required" });
        }

        const attemptResult = await client.query(
            "SELECT * FROM attempts WHERE id = $1 AND quiz_id = $2 AND user_id = $3",
            [attempt_id, quizId, userId]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ message: "Attempt Not Found" });
        }

        const attempt = attemptResult.rows[0];

        if (attempt.status !== "IN_PROGRESS") {
            return res.status(400).json({ message: "This attempt has already been submitted" });
        }

        const quizResult = await client.query(
            "SELECT * FROM quizzes WHERE id = $1",
            [quizId]
        );
        const quiz = quizResult.rows[0];

        // Backend-validated timer: cap time_taken at the quiz duration so a
        // late/replayed submit can't be recorded as taking longer than
        // allowed. The attempt is still scored — a hard reject here would
        // just lose the student's answers on a slow network.
        const elapsedSeconds = Math.floor((Date.now() - new Date(attempt.started_at).getTime()) / 1000);
        const maxSeconds = quiz.duration * 60;
        const timeTaken = Math.min(elapsedSeconds, maxSeconds);

        const questionsResult = await client.query(
            "SELECT id, marks FROM questions WHERE quiz_id = $1",
            [quizId]
        );
        const questionMarks = new Map(questionsResult.rows.map((q) => [q.id, q.marks]));

        const optionsResult = await client.query(
            `SELECT o.id, o.question_id, o.is_correct
             FROM options o
             JOIN questions q ON q.id = o.question_id
             WHERE q.quiz_id = $1`,
            [quizId]
        );
        const optionById = new Map(optionsResult.rows.map((o) => [o.id, o]));

        const answeredQuestionIds = new Set();
        let correctCount = 0;
        let incorrectCount = 0;
        let totalMarks = 0;
        let obtainedMarks = 0;

        for (const [qid, marks] of questionMarks) {
            totalMarks += marks;
        }

        await client.query("BEGIN");

        // Wipe any partial answers from a previous failed submit attempt
        // (e.g. network error) before re-inserting, so retries are safe.
        await client.query("DELETE FROM answers WHERE attempt_id = $1", [attempt_id]);

        for (const ans of answers) {

            const questionId = ans.question_id;

            if (!questionMarks.has(questionId) || answeredQuestionIds.has(questionId)) {
                continue; // ignore unknown or duplicate question ids from the client
            }

            answeredQuestionIds.add(questionId);

            const selectedOptionId = ans.selected_option_id || null;
            let isCorrect = null;

            if (selectedOptionId) {
                const option = optionById.get(selectedOptionId);
                isCorrect = !!(option && option.question_id === questionId && option.is_correct);

                if (isCorrect) {
                    correctCount += 1;
                    obtainedMarks += questionMarks.get(questionId);
                } else {
                    incorrectCount += 1;
                }
            }

            await client.query(
                `INSERT INTO answers (attempt_id, question_id, selected_option_id, is_correct)
                 VALUES ($1, $2, $3, $4)`,
                [attempt_id, questionId, selectedOptionId, isCorrect]
            );
        }

        const unanswered = questionMarks.size - answeredQuestionIds.size;
        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
        const status = percentage >= quiz.passing_score ? "PASSED" : "FAILED";

        const updated = await client.query(
            `UPDATE attempts
             SET score = $1, percentage = $2, correct_answers = $3,
                 incorrect_answers = $4, unanswered = $5, time_taken = $6,
                 status = $7, completed_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [
                obtainedMarks,
                percentage.toFixed(2),
                correctCount,
                incorrectCount,
                unanswered,
                timeTaken,
                status,
                attempt_id
            ]
        );

        await client.query("COMMIT");

        res.json({
            attempt_id: updated.rows[0].id,
            total_marks: totalMarks,
            obtained_marks: obtainedMarks,
            percentage: parseFloat(updated.rows[0].percentage),
            correct_answers: correctCount,
            incorrect_answers: incorrectCount,
            unanswered,
            time_taken: timeTaken,
            status
        });

    } catch (err) {

        await client.query("ROLLBACK");
        console.error(err);
        res.status(500).json({ message: "Server Error" });

    } finally {
        client.release();
    }
};

// Get my attempt history (student)
// GET /api/attempts
const getMyAttempts = async (req, res) => {
    try {

        const attempts = await pool.query(
            `SELECT a.*, q.title AS quiz_title, c.name AS category_name
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             LEFT JOIN categories c ON c.id = q.category_id
             WHERE a.user_id = $1
             ORDER BY a.started_at DESC`,
            [req.user.id]
        );

        res.json(attempts.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get a single attempt with full question-by-question review (student, own attempts only)
// GET /api/attempts/:id
const getAttemptById = async (req, res) => {
    try {

        const attemptResult = await pool.query(
            `SELECT a.*, q.title AS quiz_title, q.passing_score
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             WHERE a.id = $1 AND a.user_id = $2`,
            [req.params.id, req.user.id]
        );

        if (attemptResult.rows.length === 0) {
            return res.status(404).json({ message: "Attempt Not Found" });
        }

        const attempt = attemptResult.rows[0];

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

        res.json({ ...attempt, review: review.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Student dashboard stats
// GET /api/attempts/stats/summary
const getMyStats = async (req, res) => {
    try {

        const userId = req.user.id;

        const summary = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE status IN ('PASSED','FAILED')) AS quizzes_attempted,
                COUNT(*) FILTER (WHERE status = 'PASSED') AS quizzes_passed,
                COUNT(*) FILTER (WHERE status = 'FAILED') AS quizzes_failed,
                COALESCE(AVG(percentage) FILTER (WHERE status IN ('PASSED','FAILED')), 0) AS average_score,
                COALESCE(MAX(percentage) FILTER (WHERE status IN ('PASSED','FAILED')), 0) AS highest_score,
                COALESCE(SUM(correct_answers + incorrect_answers + unanswered) FILTER (WHERE status IN ('PASSED','FAILED')), 0) AS total_questions_answered
             FROM attempts
             WHERE user_id = $1`,
            [userId]
        );

        const recent = await pool.query(
            `SELECT a.id, q.title AS quiz_title, a.percentage, a.status, a.completed_at
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             WHERE a.user_id = $1 AND a.status IN ('PASSED','FAILED')
             ORDER BY a.completed_at DESC
             LIMIT 5`,
            [userId]
        );

        const stats = summary.rows[0];

        res.json({
            quizzes_attempted: parseInt(stats.quizzes_attempted, 10),
            quizzes_passed: parseInt(stats.quizzes_passed, 10),
            quizzes_failed: parseInt(stats.quizzes_failed, 10),
            average_score: parseFloat(parseFloat(stats.average_score).toFixed(2)),
            highest_score: parseFloat(parseFloat(stats.highest_score).toFixed(2)),
            total_questions_answered: parseInt(stats.total_questions_answered, 10),
            recent_attempts: recent.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    startAttempt,
    submitAttempt,
    getMyAttempts,
    getAttemptById,
    getMyStats
};
