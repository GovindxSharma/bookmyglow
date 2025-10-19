import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { verifyToken } from "./middlewares/auth.js";
import apiRoutes from "./routes/index.js";

dotenv.config();
connectDB();

const app = express();

// ✅ Whitelist frontend URLs
const allowedOrigins = [
  "http://localhost:5173", // for local dev (Vite)
  "https://bookmyglowf-w2b7.onrender.com", // replace with your deployed frontend domain
];

// ✅ Configure CORS securely
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like Postman or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`❌ Blocked by CORS: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies or auth headers
  })
);

// ✅ Body parsers
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
