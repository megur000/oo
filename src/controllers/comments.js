// TODO: Implement comments controller
// This controller should handle:
// - Creating comments on posts
// - Editing user's own comments
// - Deleting user's own comments
// - Getting comments for a post
// - Pagination for comments

const logger = require("../utils/logger");
const { getPostById } = require("../models/post");
const {
  createComment,
  getCommentById,
  getPostComments,
  updateComment,
  deleteComment,
} = require("../models/comment");

/**
 * POST /api/comments
 * body: { post_id, content }
 */
const create = async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = parseInt(req.body.post_id, 10);
    const content = (req.body.content || "").trim();

    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });
    if (!content) return res.status(400).json({ error: "Content is required" });

    const post = await getPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // ENFORCE: only allow creating comments when comments are enabled on the post
    if (!post.comments_enabled) {
      return res.status(403).json({ error: "Comments are disabled for this post" });
    }

    const created = await createComment({ post_id: postId, user_id: userId, content });
    res.status(201).json({ message: "Comment created", comment: created });
  } catch (error) {
    logger.critical("Create comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/comments/:comment_id
 * body: { content }
 */
const update = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.comment_id, 10);
    const content = (req.body.content || "").trim();

    if (Number.isNaN(commentId)) return res.status(400).json({ error: "Invalid comment id" });
    if (!content) return res.status(400).json({ error: "Content is required" });

    const updated = await updateComment(commentId, userId, content);
    if (!updated) return res.status(404).json({ error: "Comment not found or unauthorized" });

    res.json({ message: "Comment updated", comment: updated });
  } catch (error) {
    logger.critical("Update comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/comments/:comment_id
 */
const remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const commentId = parseInt(req.params.comment_id, 10);

    if (Number.isNaN(commentId)) return res.status(400).json({ error: "Invalid comment id" });

    const ok = await deleteComment(commentId, userId);
    if (!ok) return res.status(404).json({ error: "Comment not found or unauthorized" });

    res.json({ message: "Comment deleted" });
  } catch (error) {
    logger.critical("Delete comment error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/comments/post/:post_id
 * optional auth, pagination
 */
const listForPost = async (req, res) => {
  try {
    const postId = parseInt(req.params.post_id, 10);
    if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });

    const post = await getPostById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    // ENFORCE: only allow listing comments when comments are enabled on the post
    if (!post.comments_enabled) {
      return res.status(403).json({ error: "Comments are disabled for this post" });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const comments = await getPostComments(postId, limit, offset);
    res.json({ comments, pagination: { page, limit, hasMore: comments.length === limit } });
  } catch (error) {
    logger.critical("Get post comments error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  create,
  update,
  remove,
  listForPost,
};
