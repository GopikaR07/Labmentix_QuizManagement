const rateLimit = require("express-rate-limit");

// Applied to every /api route — generous, just stops obvious abuse/scraping.
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests. Please try again later." }
});

// Tighter limit on login/register/forgot-password specifically — these are
// the endpoints someone would actually try to brute-force or spam.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please try again in a few minutes." }
});

module.exports = { generalLimiter, authLimiter };
