const express = require("express");
const { validateRequest, createPostSchema } = require("../utils/validation");
const {
	create,
	getById,
	getUserPosts,
	getMyPosts,
	remove,
	update,
	searchPosts,
	getFeed,
} = require("../controllers/posts");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

/**
 * Posts routes
 */

// POST /api/posts - Create a new post
router.post("/", authenticateToken, validateRequest(createPostSchema), create);

// GET /api/posts/my - Get current user's posts
router.get("/my", authenticateToken, getMyPosts);

// GET /api/posts/search?q=... - Search posts (must be before /:post_id)
router.get("/search", optionalAuth, searchPosts);

// GET /api/posts/feed - Get posts from followed users
router.get("/feed", authenticateToken, getFeed);

// GET /api/posts/:post_id - Get a single post by ID
router.get("/:post_id", optionalAuth, getById);

// GET /api/posts/user/:user_id - Get posts by a specific user
router.get("/user/:user_id", optionalAuth, getUserPosts);

// DELETE /api/posts/:post_id - Delete a post
router.delete("/:post_id", authenticateToken, remove);

// PUT /api/posts/:post_id - Update a post (protected)
router.put("/:post_id", authenticateToken, validateRequest(createPostSchema), update);


module.exports = router;
