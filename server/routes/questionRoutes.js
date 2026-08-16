const express = require("express");

// mergeParams lets this router read :quizId from the parent quizRoutes mount
const router = express.Router({ mergeParams: true });

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {
    addQuestion,
    getQuestions
} = require("../controllers/questionController");

// GET  /api/quizzes/:quizId/questions   (admin only — includes correct answers)
router.get("/", authenticateUser, requireAdmin, getQuestions);

// POST /api/quizzes/:quizId/questions   (admin only)
router.post("/", authenticateUser, requireAdmin, addQuestion);

module.exports = router;
