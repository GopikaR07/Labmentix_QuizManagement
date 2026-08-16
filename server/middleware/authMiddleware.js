const jwt = require("jsonwebtoken");

// Verifies the JWT and attaches the decoded payload (id, email, role) to req.user
const authenticateUser = (req, res, next) => {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Access Denied. No Token Provided."
            });
        }

        const token = authHeader.split(" ")[1];

        const verified = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = verified;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid Token"
        });

    }

};

// Must be used AFTER authenticateUser. Blocks anyone who isn't ADMIN.
const requireAdmin = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({ message: "Access Denied. No Token Provided." });
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "Access Denied. Admin privileges required."
        });
    }

    next();

};

// Generic version in case we need more roles later (kept for flexibility)
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({ message: "Access Denied. No Token Provided." });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access Denied. Requires role: ${allowedRoles.join(" or ")}`
            });
        }

        next();

    };
};

module.exports = {
    authenticateUser,
    requireAdmin,
    requireRole
};
