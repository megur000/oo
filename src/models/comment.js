const { query } = require("../utils/database");

/**
 * Comment model for managing post comments
 */

/**
 * Create a comment
 */
const createComment = async ({ post_id, user_id, content }) => {
  const result = await query(
    `INSERT INTO comments (post_id, user_id, content, created_at, updated_at, is_deleted)
     VALUES ($1, $2, $3, NOW(), NOW(), false)
     RETURNING id, post_id, user_id, content, is_deleted, created_at, updated_at`,
    [post_id, user_id, content]
  );
  return result.rows[0];
};

/**
 * Get comment by id (includes author info)
 */
const getCommentById = async (commentId) => {
  const id = parseInt(commentId, 10);
  if (Number.isNaN(id)) throw new Error("Invalid comment id");

  const result = await query(
    `SELECT c.*, u.username, u.full_name
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Get comments for a post (non-deleted) with pagination
 */
const getPostComments = async (postId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT c.id, c.post_id, c.user_id, c.content, c.created_at, c.updated_at, u.username, u.full_name
     FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.post_id = $1 AND COALESCE(c.is_deleted, false) = false
     ORDER BY c.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset]
  );
  return result.rows;
};

/**
 * Update a comment (only owner, only if not deleted)
 */
const updateComment = async (commentId, userId, content) => {
  const result = await query(
    `UPDATE comments
     SET content = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3 AND COALESCE(is_deleted, false) = false
     RETURNING id, post_id, user_id, content, is_deleted, created_at, updated_at`,
    [content, commentId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Soft-delete a comment (only owner)
 */
const deleteComment = async (commentId, userId) => {
  const result = await query(
    `UPDATE comments
     SET is_deleted = true, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND COALESCE(is_deleted, false) = false
     RETURNING id`,
    [commentId, userId]
  );
  return result.rowCount > 0;
};

module.exports = {
  createComment,
  getCommentById,
  getPostComments,
  updateComment,
  deleteComment,
};
