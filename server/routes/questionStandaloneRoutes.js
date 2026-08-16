const express = require("express");
const router = express.Router();

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {
    updateQuestion,
    deleteQuestion
} = require("../controllers/questionController");

// PUT    /api/questions/:id   (admin only)
router.put("/:id", authenticateUser, requireAdmin, updateQuestion);

// DELETE /api/questions/:id   (admin only)
router.delete("/:id", authenticateUser, requireAdmin, deleteQuestion);

module.exports = router;
