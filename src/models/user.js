const { query } = require("../utils/database");
const bcrypt = require("bcryptjs");

/**
 * User model for database operations
 */

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async ({ username, email, password, full_name }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (username, email, password_hash, full_name, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, username, email, full_name, created_at`,
    [username, email, hashedPassword, full_name],
  );

  return result.rows[0];
};

/**
 * Find user by username
 * @param {string} username - Username to search for
 * @returns {Promise<Object|null>} User object or null
 */
const getUserByUsername = async (username) => {
  const result = await query("SELECT * FROM users WHERE username = $1", [
    username,
  ]);

  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<Object|null>} User object or null
 */
const getUserById = async (id) => {
  const result = await query(
    "SELECT id, username, email, full_name, created_at FROM users WHERE id = $1",
    [id],
  );

  return result.rows[0] || null;
};

/**
 * Verify user password
 * @param {string} plainPassword - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} Password match result
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Find users by partial username or full_name with pagination
const findUsersByName = async (name, limit = 20, offset = 0) => {
  const term = `%${name}%`;
  const result = await query(
    `SELECT id, username, full_name, created_at
     FROM users
     WHERE username ILIKE $1 OR full_name ILIKE $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [term, limit, offset]
  );
  return result.rows;
};

/**
 * Get user profile including follower/following counts
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getUserProfile = async (id) => {
  const uid = parseInt(id, 10);
  if (Number.isNaN(uid)) throw new Error("Invalid user id");

  const result = await query(
    `SELECT
       u.id, u.username, u.email, u.full_name, u.created_at,
       (SELECT COUNT(*) FROM follows WHERE following_id = u.id)::int AS follower_count,
       (SELECT COUNT(*) FROM follows WHERE follower_id = u.id)::int AS following_count
     FROM users u
     WHERE u.id = $1`,
    [uid]
  );

  return result.rows[0] || null;
};

/**
 * Update user profile (email, full_name, password)
 * @param {number} id
 * @param {Object} fields
 * @returns {Promise<Object|null>}
 */
const updateUserProfile = async (id, fields) => {
  const uid = parseInt(id, 10);
  if (Number.isNaN(uid)) throw new Error("Invalid user id");

  const sets = [];
  const values = [];
  let idx = 1;

  if (fields.email !== undefined) {
    sets.push(`email = $${idx++}`);
    values.push(fields.email);
  }
  if (fields.full_name !== undefined) {
    sets.push(`full_name = $${idx++}`);
    values.push(fields.full_name);
  }
  if (fields.password !== undefined) {
    const hashed = await bcrypt.hash(fields.password, 10);
    sets.push(`password_hash = $${idx++}`);
    values.push(hashed);
  }

  if (sets.length === 0) {
    // nothing to update, return current profile
    return getUserProfile(uid);
  }

  values.push(uid);
  const sql = `
    UPDATE users
    SET ${sets.join(", ")}, updated_at = NOW()
    WHERE id = $${idx}
    RETURNING id, username, email, full_name, created_at
  `;
  const result = await query(sql, values);
  return result.rows[0] || null;
};

module.exports = {
  createUser,
  getUserByUsername,
  getUserById,
  verifyPassword,
  findUsersByName,
  getUserProfile,
  updateUserProfile,
};
