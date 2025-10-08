import express from "express";
import { register, login, logout, updateUser, deleteUser } from "../controllers/authController.js";
import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.put("/:id", verifyToken, checkPermission("update"), updateUser);
router.delete("/:id", verifyToken, checkPermission("delete"), deleteUser);

export default router;
