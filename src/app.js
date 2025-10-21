import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { verifyToken } from "./middlewares/auth.js";
import apiRoutes from "./routes/index.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Read allowed origins from env (comma-separated for multiple URLs)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"]; // fallback for local dev

// ✅ Configure CORS dynamically
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ✅ Body parsersaddasd
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Root test route
app.get("/", (req, res) => {
  res.send("✨ Book My Glow backend is running!");
});

// ✅ All API routes
app.use("/", apiRoutes);

// ✅ Example protected route
app.get("/api/profile", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}\n🌐 Allowed Origins: ${allowedOrigins.join(", ")}`)
);
