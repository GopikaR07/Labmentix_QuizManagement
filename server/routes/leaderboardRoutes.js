const express = require("express");
const router = express.Router();

const { authenticateUser } = require("../middleware/authMiddleware");
const { getLeaderboard } = require("../controllers/leaderboardController");

router.get("/", authenticateUser, getLeaderboard);

module.exports = router;
