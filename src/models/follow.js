const { query } = require("../utils/database");

/**
 * Follow model for managing user relationships
 */

/**
 * Follow a user (idempotent)
 * @returns {Object} { ok: boolean, row: object|null, message?: string }
 */
const followUser = async (followerId, followingId) => {
  if (followerId === followingId) {
    return { ok: false, message: "cannot follow self" };
  }

  const result = await query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING follower_id, following_id, created_at`,
    [followerId, followingId]
  );

  return { ok: result.rowCount > 0, row: result.rows[0] || null };
};

/**
 * Unfollow a user
 * @returns {boolean} true if a row was removed
 */
const unfollowUser = async (followerId, followingId) => {
  const result = await query(
    `DELETE FROM follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, followingId]
  );
  return result.rowCount > 0;
};

/**
 * Get users that a given user is following (uses follower_id index)
 */
const getFollowing = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT u.id, u.username, u.full_name, f.created_at
     FROM follows f
     JOIN users u ON f.following_id = u.id
     WHERE f.follower_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

/**
 * Get followers of a given user (uses idx_follows_following_id)
 */
const getFollowers = async (userId, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT u.id, u.username, u.full_name, f.created_at
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return result.rows;
};

/**
 * Get follower / following counts for a user
 */
const getFollowCounts = async (userId) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*) FROM follows WHERE follower_id = $1)::int AS following_count,
       (SELECT COUNT(*) FROM follows WHERE following_id = $1)::int AS follower_count`,
    [userId]
  );
  return result.rows[0] || { following_count: 0, follower_count: 0 };
};

module.exports = {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowCounts,
};
