const express = require("express");

const router = express.Router();

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {

    createQuiz,
    getAllQuizzes,
    getQuizById,
    updateQuiz,
    setQuizStatus,
    deleteQuiz

} = require("../controllers/quizController");

const {
    startAttempt,
    submitAttempt
} = require("../controllers/attemptController");

// Nested question routes: /api/quizzes/:quizId/questions
const questionRoutes = require("./questionRoutes");
router.use("/:quizId/questions", questionRoutes);

// Student attempt flow — any authenticated user can attempt a published quiz
router.post("/:quizId/start", authenticateUser, startAttempt);
router.post("/:quizId/submit", authenticateUser, submitAttempt);

router.post("/", authenticateUser, requireAdmin, createQuiz);

router.get("/", authenticateUser, getAllQuizzes);

router.get("/:id", authenticateUser, getQuizById);

router.put("/:id", authenticateUser, requireAdmin, updateQuiz);

router.patch("/:id/publish", authenticateUser, requireAdmin, setQuizStatus);

router.delete("/:id", authenticateUser, requireAdmin, deleteQuiz);

module.exports = router;
