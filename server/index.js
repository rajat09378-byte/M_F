require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:4173"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/upload", require("./routes/upload"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/session", require("./routes/session"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Mind Forge API is running",
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("✅ MongoDB connected");
    } else {
      console.log("⚠️  No MONGODB_URI set - running without database (sessions won't persist)");
    }
  } catch (err) {
    console.warn("⚠️  MongoDB connection failed:", err.message);
    console.log("   Running without database - sessions won't persist");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Mind Forge Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  });
};

startServer();
