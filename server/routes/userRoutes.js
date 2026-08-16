const express = require("express");
const router = express.Router();

const { authenticateUser, requireAdmin } = require("../middleware/authMiddleware");

const {
    getAllUsers,
    getUserById,
    updateUser,
    setUserStatus,
    deleteUser
} = require("../controllers/userController");

router.get("/", authenticateUser, requireAdmin, getAllUsers);

router.get("/:id", authenticateUser, requireAdmin, getUserById);

router.put("/:id", authenticateUser, requireAdmin, updateUser);

router.patch("/:id/status", authenticateUser, requireAdmin, setUserStatus);

router.delete("/:id", authenticateUser, requireAdmin, deleteUser);

module.exports = router;
