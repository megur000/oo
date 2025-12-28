const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const logger = require("./utils/logger");
const { connectDB } = require("./utils/database");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const likesRoutes = require("./routes/likes");
const commentsRoutes = require("./routes/comments");

/**
 * Express application setup and configuration
 */
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/comments", commentsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler — Task 1:
// Place the 404 handler before the global error handler so that unmatched routes
// return 404 (Route not found) instead of being swallowed by the error handler.
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route home" });
});

// Global error handler (must be LAST middleware)
// Catches errors passed via next(err) and any unhandled errors in routes.
app.use((err, req, res, next) => {
  logger.critical("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
  });
});

/**
 * Start the server
 */
const startServer = async () => {
	try {
		await connectDB();
		app.listen(PORT, () => {
			logger.verbose(`Server is running on port ${PORT}`);
			logger.verbose(
				`Environment: ${process.env.NODE_ENV || "development"}`
			);
		});
	} catch (error) {
		logger.critical("Failed to start server:", error);
		process.exit(1);
	}
};

startServer();

module.exports = app;
