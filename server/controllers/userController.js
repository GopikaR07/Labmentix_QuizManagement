const pool = require("../config/database");

// Get all students (admin only)
// GET /api/users   optional ?search=name-or-email
const getAllUsers = async (req, res) => {
    try {

        const { search } = req.query;

        const conditions = [`role = 'STUDENT'`];
        const values = [];

        if (search) {
            values.push(`%${search}%`);
            conditions.push(`(name ILIKE $${values.length} OR email ILIKE $${values.length})`);
        }

        const users = await pool.query(
            `SELECT u.id, u.name, u.email, u.status, u.created_at,
                    COUNT(a.id) FILTER (WHERE a.status IN ('PASSED','FAILED')) AS quizzes_attempted,
                    COALESCE(AVG(a.percentage) FILTER (WHERE a.status IN ('PASSED','FAILED')), 0) AS average_score,
                    COALESCE(MAX(a.percentage) FILTER (WHERE a.status IN ('PASSED','FAILED')), 0) AS highest_score
             FROM users u
             LEFT JOIN attempts a ON a.user_id = u.id
             WHERE ${conditions.join(" AND ")}
             GROUP BY u.id
             ORDER BY u.created_at DESC`,
            values
        );

        const formatted = users.rows.map((u) => ({
            ...u,
            quizzes_attempted: parseInt(u.quizzes_attempted, 10),
            average_score: parseFloat(parseFloat(u.average_score).toFixed(2)),
            highest_score: parseFloat(parseFloat(u.highest_score).toFixed(2))
        }));

        res.json(formatted);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get a single student's profile + quiz history (admin only)
// GET /api/users/:id
const getUserById = async (req, res) => {
    try {

        const userResult = await pool.query(
            "SELECT id, name, email, role, status, created_at FROM users WHERE id = $1 AND role = 'STUDENT'",
            [req.params.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "Student Not Found" });
        }

        const history = await pool.query(
            `SELECT a.id, q.title AS quiz_title, a.percentage, a.status, a.started_at, a.completed_at
             FROM attempts a
             JOIN quizzes q ON q.id = a.quiz_id
             WHERE a.user_id = $1
             ORDER BY a.started_at DESC`,
            [req.params.id]
        );

        res.json({ ...userResult.rows[0], quiz_history: history.rows });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update a student's name/email (admin only)
// PUT /api/users/:id
const updateUser = async (req, res) => {
    try {

        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: "Name and email are required" });
        }

        const result = await pool.query(
            `UPDATE users SET name = $1, email = $2
             WHERE id = $3 AND role = 'STUDENT'
             RETURNING id, name, email, role, status, created_at`,
            [name, email, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Student Not Found" });
        }

        res.json(result.rows[0]);

    } catch (err) {

        if (err.code === "23505") { // unique_violation on email
            return res.status(400).json({ message: "Email already in use" });
        }

        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Activate / deactivate a student account (admin only)
// PATCH /api/users/:id/status   body: { status: "ACTIVE" | "INACTIVE" }
const setUserStatus = async (req, res) => {
    try {

        const { status } = req.body;

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ message: "Status must be ACTIVE or INACTIVE" });
        }

        const result = await pool.query(
            `UPDATE users SET status = $1
             WHERE id = $2 AND role = 'STUDENT'
             RETURNING id, name, email, role, status, created_at`,
            [status, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Student Not Found" });
        }

        res.json(result.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete a student account (admin only)
// DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {

        const result = await pool.query(
            "DELETE FROM users WHERE id = $1 AND role = 'STUDENT' RETURNING id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Student Not Found" });
        }

        res.json({ message: "Student Deleted Successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    setUserStatus,
    deleteUser
};
