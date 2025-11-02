import express from "express";
import authRoutes from "./authRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import serviceRoutes from "./serviceRoutes.js";
import attendanceRoutes from "./attendanceRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import employeeRoutes from "./employeeRoutes.js"
// import whatsappRoutes from "./whatsappRoutes.js"


const router = express.Router();

router.use("/auth", authRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/services", serviceRoutes);
router.use("/attendance", attendanceRoutes);

router.use("/employee", employeeRoutes);
router.use("/payments", paymentRoutes);
// router.use("/whatsapp", whatsappRoutes);
// router.use("/inventory", inventoryRoutes);

export default router;
