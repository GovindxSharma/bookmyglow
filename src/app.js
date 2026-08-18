import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { verifyToken } from "./middlewares/auth.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

// Connect Database & Seed Data
connectDB();

const app = express();

// Configure CORS
const rawOrigins = process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173";
const allowedOrigins = rawOrigins.split(",").map((url) => url.trim()).filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.includes("localhost") ||
        origin.includes("127.0.0.1") ||
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".onrender.com")
      ) {
        callback(null, true);
      } else {
        console.warn(`⚠️ Warning: Origin ${origin} not in explicit whitelist, but permitting in dev`);
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health / Status Routes
app.get(["/", "/health", "/api/health"], (req, res) => {
  res.json({
    status: "ok",
    app: "BookMyGlow Salon Management API",
    version: "2.0.0",
    time: new Date().toISOString(),
    salon: {
      name: process.env.SALON_NAME || "Aura Salon & Day Spa",
      phone: process.env.SALON_PHONE || "+91 98765 43210",
      address: process.env.SALON_ADDRESS || "Suite 101, Central Boulevard, Luxury Promenade, Metro City",
    },
  });
});

// Salon Info Route
app.get(["/salon-info", "/api/salon-info"], (req, res) => {
  res.json({
    success: true,
    salon: {
      name: process.env.SALON_NAME || "Aura Salon & Day Spa",
      phone: process.env.SALON_PHONE || "+91 98765 43210",
      address: process.env.SALON_ADDRESS || "Suite 101, Central Boulevard, Luxury Promenade, Metro City",
    },
  });
});

// API routes (support both root path and /api prefix)
app.use("/api", apiRoutes);
app.use("/", apiRoutes);

// Protected user profile route
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ success: true, message: "Protected profile accessed", user: req.user });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\n✨ ========================================================`);
  console.log(`🚀 BookMyGlow Salon Server running on port: ${PORT}`);
  console.log(`🌐 Whitelisted Origins: ${allowedOrigins.join(", ")}`);
  console.log(`✨ ========================================================\n`);
});

export default app;
