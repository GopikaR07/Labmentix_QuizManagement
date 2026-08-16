const bcrypt = require("bcrypt");
const pool = require("../config/database");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Public registration. Always creates a STUDENT account.
// Admin accounts are not self-serve — they're seeded directly in the DB
// (see db/schema.sql) or created by an existing admin later.
const registerUser = async (req, res) => {

    try {

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const existingUser = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO users(name, email, password, role)
             VALUES($1, $2, $3, 'STUDENT')
             RETURNING id, name, email, role, status, created_at`,
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

};

const loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                message: "Invalid Email"
            });
        }

        const user = result.rows[0];

        if (user.status === "INACTIVE") {
            return res.status(403).json({
                message: "This account has been deactivated. Contact an admin."
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if (!validPassword) {
            return res.status(400).json({
                message: "Invalid Password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }
};

// POST /api/auth/forgot-password   body: { email }
// Generates a one-time reset token valid for 15 minutes.
//
// NOTE: There's no email service wired up yet (that needs an SMTP/email
// provider, which is a separate setup step). For now this returns the raw
// token directly in the response so you can test the flow end-to-end.
// Before this goes live, swap the `reset_token` in the response for an
// actual email send (e.g. via nodemailer) and stop returning it here.
const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const result = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [email]
        );

        // Always respond the same way whether or not the email exists,
        // so this endpoint can't be used to check which emails are registered.
        if (result.rows.length === 0) {
            return res.json({
                message: "If that email is registered, a reset link has been sent."
            });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await pool.query(
            "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3",
            [hashedToken, expiry, result.rows[0].id]
        );

        res.json({
            message: "If that email is registered, a reset link has been sent.",
            // TEMPORARY — remove once real email sending is wired up.
            dev_reset_token: rawToken
        });

    } catch (error) {

        console.error(error);
        res.status(500).json({ message: "Server Error" });

    }
};

// POST /api/auth/reset-password   body: { token, new_password }
const resetPassword = async (req, res) => {
    try {

        const { token, new_password } = req.body;

        if (!token || !new_password) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        if (new_password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters" });
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        const result = await pool.query(
            `SELECT id FROM users
             WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
            [hashedToken]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "Reset link is invalid or has expired" });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await pool.query(
            `UPDATE users
             SET password = $1, reset_token = NULL, reset_token_expiry = NULL
             WHERE id = $2`,
            [hashedPassword, result.rows[0].id]
        );

        res.json({ message: "Password has been reset successfully. You can now log in." });

    } catch (error) {

        console.error(error);
        res.status(500).json({ message: "Server Error" });

    }
};

module.exports = {
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword
};
