const express = require("express");
const router = express.Router();

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {
    getAllAttempts,
    getAttemptDetail,
    getAnalytics
} = require("../controllers/adminController");

router.get("/analytics", authenticateUser, requireAdmin, getAnalytics);

router.get("/attempts", authenticateUser, requireAdmin, getAllAttempts);

router.get("/attempts/:id", authenticateUser, requireAdmin, getAttemptDetail);

module.exports = router;
