const { query } = require("../utils/database");

/**
 * Like model for managing post likes
 */

/**
 * Like a post (idempotent)
 */
const likePost = async (userId, postId) => {
  const result = await query(
    `INSERT INTO likes (user_id, post_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING user_id, post_id, created_at`,
    [userId, postId],
  );
  return { ok: result.rowCount > 0, row: result.rows[0] || null };
};

/**
 * Unlike a post
 */
const unlikePost = async (userId, postId) => {
  const result = await query(
    `DELETE FROM likes WHERE user_id = $1 AND post_id = $2`,
    [userId, postId],
  );
  return result.rowCount > 0;
};

/**
 * Get users who liked a post
 */
const getPostLikes = async (postId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT u.id, u.username, u.full_name, l.created_at
     FROM likes l
     JOIN users u ON l.user_id = u.id
     WHERE l.post_id = $1
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [postId, limit, offset],
  );
  return result.rows;
};

/**
 * Get posts liked by a user (returns basic post info)
 */
const getUserLikes = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT p.*, u.username, u.full_name, l.created_at AS liked_at
     FROM likes l
     JOIN posts p ON l.post_id = p.id
     JOIN users u ON p.user_id = u.id
     WHERE l.user_id = $1
     ORDER BY l.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );
  return result.rows;
};

/**
 * Check whether a user has liked a post
 */
const hasUserLikedPost = async (userId, postId) => {
  const result = await query(
    `SELECT 1 FROM likes WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
    [userId, postId],
  );
  return result.rowCount > 0;
};

module.exports = {
  likePost,
  unlikePost,
  getPostLikes,
  getUserLikes,
  hasUserLikedPost,
};
