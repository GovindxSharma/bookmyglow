import express from "express";
import { register, login, logout, updateUser, deleteUser, getAllEmployees} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/auth.js";
import { checkPermission } from "../middlewares/permission.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", verifyToken, logout);
router.put("/:id",
  // verifyToken, checkPermission("update"),
  updateUser);
router.delete("/:id",
  // verifyToken, checkPermission("delete"),
  deleteUser);
router.get(
  "/employees",
//   verifyToken,
//   checkPermission("read", "user"), // only roles with read access on user can call
  getAllEmployees
);

export default router;
