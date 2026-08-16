const express = require("express");
const router = express.Router();

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categoryController");

router.get("/", authenticateUser, getAllCategories);

router.post("/", authenticateUser, requireAdmin, createCategory);

router.put("/:id", authenticateUser, requireAdmin, updateCategory);

router.delete("/:id", authenticateUser, requireAdmin, deleteCategory);

module.exports = router;
