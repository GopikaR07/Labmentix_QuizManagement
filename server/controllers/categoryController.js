const pool = require("../config/database");

// GET /api/categories  (any authenticated user)
const getAllCategories = async (req, res) => {
    try {

        const categories = await pool.query(
            `SELECT c.*,
                    COUNT(q.id) FILTER (WHERE q.status = 'PUBLISHED') AS quiz_count
             FROM categories c
             LEFT JOIN quizzes q ON q.category_id = c.id
             GROUP BY c.id
             ORDER BY c.name`
        );

        res.json(categories.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// POST /api/categories  (admin only)
const createCategory = async (req, res) => {
    try {

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const existing = await pool.query(
            "SELECT id FROM categories WHERE name = $1",
            [name]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const category = await pool.query(
            `INSERT INTO categories(name, description)
             VALUES($1, $2)
             RETURNING *`,
            [name, description || null]
        );

        res.status(201).json(category.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// PUT /api/categories/:id  (admin only)
const updateCategory = async (req, res) => {
    try {

        const { name, description } = req.body;

        const category = await pool.query(
            `UPDATE categories
             SET name = $1, description = $2
             WHERE id = $3
             RETURNING *`,
            [name, description || null, req.params.id]
        );

        if (category.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category.rows[0]);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

// DELETE /api/categories/:id  (admin only)
const deleteCategory = async (req, res) => {
    try {

        const result = await pool.query(
            "DELETE FROM categories WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json({ message: "Category deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
};
