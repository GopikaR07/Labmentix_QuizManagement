require("dotenv").config();

const pool = require("./config/database");

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 5000;

const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const quizRoutes = require("./routes/quizRoutes");
const questionStandaloneRoutes = require("./routes/questionStandaloneRoutes");
const userRoutes = require("./routes/userRoutes");
const attemptRoutes = require("./routes/attemptRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const { generalLimiter } = require("./middleware/rateLimiter");

app.use(cors());
app.use(express.json());
app.use("/api", generalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/quizzes", quizRoutes);          // also handles /api/quizzes/:quizId/questions, /start, /submit
app.use("/api/questions", questionStandaloneRoutes); // PUT/DELETE /api/questions/:id
app.use("/api/users", userRoutes);            // admin-only student management
app.use("/api/attempts", attemptRoutes);      // student's own attempt history + stats
app.use("/api/admin", adminRoutes);           // admin attempt views + analytics
app.use("/api/leaderboard", leaderboardRoutes);

app.get("/", (req, res) => {
    res.send("Quiz Platform API is running");
});

pool.connect()
    .then(() => {
        console.log("Database Connected Successfully");
    })
    .catch((err) => {
        console.error("Database Connection Failed:", err.message);
    });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
