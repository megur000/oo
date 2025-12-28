const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const {
  create,
  update,
  remove,
  listForPost,
} = require("../controllers/comments");

const router = express.Router();

/**
 * Comments routes
 */

// POST /api/comments - Create a comment on a post
router.post("/", authenticateToken, create);

// PUT /api/comments/:comment_id - Update a comment
router.put("/:comment_id", authenticateToken, update);

// DELETE /api/comments/:comment_id - Delete a comment
router.delete("/:comment_id", authenticateToken, remove);

// GET /api/comments/post/:post_id - Get comments for a post
router.get("/post/:post_id", optionalAuth, listForPost);

module.exports = router;
