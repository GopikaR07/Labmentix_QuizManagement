const express = require("express");
const router = express.Router();
const { authenticateUser } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

const {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

router.post("/register", authLimiter, registerUser);

router.post("/login", authLimiter, loginUser);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password", authLimiter, resetPassword);

router.get("/profile", authenticateUser, (req, res) => {

    res.json({
        message: "Protected Route Accessed",
        user: req.user
    });

});

module.exports = router;
