const pool = require("../config/database");

// GET /api/leaderboard
// Query params:
//   period       overall (default) | monthly | weekly
//   category_id  restrict to attempts on quizzes in this category
//   sort         average (default) | highest | completed
const getLeaderboard = async (req, res) => {
    try {

        const { period = "overall", category_id, sort = "average" } = req.query;

        const conditions = [`a.status IN ('PASSED','FAILED')`];
        const values = [];

        if (period === "monthly") {
            conditions.push(`a.completed_at >= NOW() - INTERVAL '30 days'`);
        } else if (period === "weekly") {
            conditions.push(`a.completed_at >= NOW() - INTERVAL '7 days'`);
        }

        if (category_id) {
            values.push(category_id);
            conditions.push(`q.category_id = $${values.length}`);
        }

        const sortColumn = {
            average: "average_score",
            highest: "highest_score",
            completed: "quizzes_completed"
        }[sort] || "average_score";

        const leaderboard = await pool.query(
            `SELECT u.id AS user_id, u.name AS student_name,
                    COUNT(a.id) AS quizzes_completed,
                    ROUND(AVG(a.percentage), 2) AS average_score,
                    ROUND(MAX(a.percentage), 2) AS highest_score
             FROM attempts a
             JOIN users u ON u.id = a.user_id
             JOIN quizzes q ON q.id = a.quiz_id
             WHERE ${conditions.join(" AND ")}
             GROUP BY u.id, u.name
             ORDER BY ${sortColumn} DESC
             LIMIT 50`,
            values
        );

        const ranked = leaderboard.rows.map((row, index) => ({
            rank: index + 1,
            user_id: row.user_id,
            student_name: row.student_name,
            quizzes_completed: parseInt(row.quizzes_completed, 10),
            average_score: parseFloat(row.average_score),
            highest_score: parseFloat(row.highest_score)
        }));

        res.json(ranked);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = { getLeaderboard };
