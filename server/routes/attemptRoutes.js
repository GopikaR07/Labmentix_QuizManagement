const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authMiddleware");

const {
    getMyAttempts,
    getAttemptById,
    getMyStats
} = require("../controllers/attemptController");

// GET /api/attempts/stats/summary  — must be registered before /:id
// so "stats" isn't swallowed by the :id param route.
router.get("/stats/summary", authenticateUser, getMyStats);

router.get("/", authenticateUser, getMyAttempts);

router.get("/:id", authenticateUser, getAttemptById);

module.exports = router;
