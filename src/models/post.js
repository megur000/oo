const { query } = require("../utils/database");

/**
 * Post model for database operations
 */

/**
 * Create a new post
 * @param {Object} postData - Post data
 * @returns {Promise<Object>} Created post
 */
const createPost = async ({
  user_id,
  content,
  media_url,
  comments_enabled = true,
}) => {
  const result = await query(
    `INSERT INTO posts (user_id, content, media_url, comments_enabled, created_at, is_deleted)
     VALUES ($1, $2, $3, $4, NOW(), false)
     RETURNING id, user_id, content, media_url, comments_enabled, created_at`,
    [user_id, content, media_url, comments_enabled],
  );

  return result.rows[0];
};

/**
 * Get post by ID
 * @param {number} postId - Post ID
 * @returns {Promise<Object|null>} Post object or null
 */
const getPostById = async (postId) => {
  const id = parseInt(postId, 10);
  if (Number.isNaN(id)) {
    throw new Error("Invalid post id");
  }

  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1 AND COALESCE(p.is_deleted, false) = false`,
    [id],
  );

  return result.rows[0] || null;
};

/**
 * Get posts by user ID
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
const getPostsByUserId = async (userId, limit = 20, offset = 0) => {
  const uid = parseInt(userId, 10);
  if (Number.isNaN(uid)) {
    throw new Error("Invalid user id");
  }

  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE p.user_id = $1 AND COALESCE(p.is_deleted, false) = false
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [uid, limit, offset],
  );

  return result.rows;
};

/**
 * Delete a post (soft delete)
 * @param {number} postId - Post ID
 * @param {number} userId - User ID (for ownership verification)
 * @returns {Promise<boolean>} Success status
 */
const deletePost = async (postId, userId) => {
  const pid = parseInt(postId, 10);
  const uid = parseInt(userId, 10);
  if (Number.isNaN(pid) || Number.isNaN(uid)) {
    throw new Error("Invalid post id or user id");
  }

  const result = await query(
    `UPDATE posts
     SET is_deleted = true, updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND COALESCE(is_deleted, false) = false`,
    [pid, uid],
  );

  return result.rowCount > 0;
};

/**
 * Update a post (only if it belongs to the given user and is not deleted)
 * @param {number} postId
 * @param {number} userId
 * @param {Object} fields - fields to update: { content, media_url, comments_enabled }
 * @returns {Promise<Object|null>} Updated post or null if not found/unauthorized
 */
const updatePost = async (postId, userId, { content, media_url, comments_enabled }) => {
  const result = await query(
    `UPDATE posts
     SET content = COALESCE($1, content),
         media_url = COALESCE($2, media_url),
         comments_enabled = COALESCE($3, comments_enabled),
         updated_at = NOW()
     WHERE id = $4 AND user_id = $5 AND COALESCE(is_deleted, false) = false
     RETURNING id, user_id, content, media_url, comments_enabled, created_at, updated_at`,
    [content, media_url, comments_enabled, postId, userId],
  );

  return result.rows[0] || null;
};

/**
 * Search posts by content, username or full_name (only non-deleted)
 * @param {string} q - search query
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<Array>} Array of posts
 */
const searchPosts = async (q, limit = 20, offset = 0) => {
  const term = `%${q}%`;
  const result = await query(
    `SELECT p.*, u.username, u.full_name
     FROM posts p
     JOIN users u ON p.user_id = u.id
     WHERE COALESCE(p.is_deleted, false) = false
       AND (p.content ILIKE $1 OR u.username ILIKE $1 OR u.full_name ILIKE $1)
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [term, limit, offset]
  );

  return result.rows;
};

/**
 * Get feed for user (posts from followed users and own posts)
 * @param {number} userId - User ID
 * @param {number} limit - Number of posts to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of posts
 */
const getFeedForUser = async (userId, limit = 20, offset = 0) => {
  const uid = parseInt(userId, 10);
  if (Number.isNaN(uid)) throw new Error("Invalid user id");

  const result = await query(
    `SELECT
       p.id, p.user_id, p.content, p.media_url, p.comments_enabled, p.created_at, p.updated_at,
       u.username, u.full_name,
       COALESCE(l.likes_count, 0)::int AS likes_count,
       COALESCE(c.comments_count, 0)::int AS comments_count,
       EXISTS(SELECT 1 FROM likes lk WHERE lk.post_id = p.id AND lk.user_id = $1) AS liked_by_user
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN (
       SELECT post_id, COUNT(*) AS likes_count
       FROM likes
       GROUP BY post_id
     ) l ON l.post_id = p.id
     LEFT JOIN (
       SELECT post_id, COUNT(*) AS comments_count
       FROM comments
       WHERE COALESCE(is_deleted, false) = false
       GROUP BY post_id
     ) c ON c.post_id = p.id
     WHERE COALESCE(p.is_deleted, false) = false
       AND (
         p.user_id = $1
         OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $1)
       )
     ORDER BY p.created_at DESC
     LIMIT $2 OFFSET $3`,
    [uid, limit, offset]
  );

  return result.rows;
};

module.exports = {
  createPost,
  getPostById,
  getPostsByUserId,
  deletePost,
  updatePost,
  searchPosts,
  getFeedForUser,
};
