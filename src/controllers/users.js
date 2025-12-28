// TODO: Implement users controller
// This controller should handle:
// - Following a user
// - Unfollowing a user
// - Getting users that the current user is following
// - Getting users that follow the current user
// - Getting follow counts for a user

const logger = require("../utils/logger");
const {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  getFollowCounts,
} = require("../models/follow");

const {
  findUsersByName,
  getUserProfile: getUserProfileModel,
  updateUserProfile: updateUserProfileModel,
} = require("../models/user");

/**
 * POST /api/users/:user_id/follow
 */
const follow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.user_id, 10);
    if (Number.isNaN(followingId)) return res.status(400).json({ error: "Invalid user id" });

    const result = await followUser(followerId, followingId);
    if (!result.ok) return res.status(400).json({ error: result.message || "Already following" });

    res.json({ message: "Followed", follow: result.row });
  } catch (error) {
    logger.critical("Follow error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * DELETE /api/users/:user_id/unfollow
 */
const unfollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = parseInt(req.params.user_id, 10);
    if (Number.isNaN(followingId)) return res.status(400).json({ error: "Invalid user id" });

    const ok = await unfollowUser(followerId, followingId);
    if (!ok) return res.status(404).json({ error: "Not following" });

    res.json({ message: "Unfollowed" });
  } catch (error) {
    logger.critical("Unfollow error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/users/following
 */
const myFollowing = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const rows = await getFollowing(req.user.id, limit, offset);
    res.json({ following: rows, pagination: { page, limit } });
  } catch (error) {
    logger.critical("Get following error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/users/followers
 */
const myFollowers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;
    const rows = await getFollowers(req.user.id, limit, offset);
    res.json({ followers: rows, pagination: { page, limit } });
  } catch (error) {
    logger.critical("Get followers error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/users/:user_id/stats
 */
const followCounts = async (req, res) => {
  try {
    let userId = null;
    if (req.params.user_id) {
      userId = parseInt(req.params.user_id, 10);
    } else if (req.user && req.user.id) {
      userId = parseInt(req.user.id, 10);
    }
    if (userId === null || Number.isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });

    const counts = await getFollowCounts(userId);
    res.json(counts);
  } catch (error) {
    logger.critical("Get follow counts error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/users/search?name=...&page=&limit=
 */
const searchUsers = async (req, res) => {
  try {
    const name = (req.query.name || "").trim();
    if (!name) return res.status(400).json({ error: "Missing query parameter 'name'" });

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const offset = (page - 1) * limit;

    const users = await findUsersByName(name, limit, offset);
    res.json({ users, pagination: { page, limit, hasMore: users.length === limit } });
  } catch (error) {
    logger.critical("Search users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/users/:user_id/profile
 */
const getUserProfile = async (req, res) => {
  try {
    let userId = null;
    if (req.params.user_id) {
      userId = parseInt(req.params.user_id, 10);
    } else if (req.user && req.user.id) {
      userId = parseInt(req.user.id, 10);
    }
    if (userId === null || Number.isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });

    const profile = await getUserProfileModel(userId);
    if (!profile) return res.status(404).json({ error: "User not found" });

    res.json({ profile });
  } catch (error) {
    logger.critical("Get user profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * PUT /api/users/profile  (update current user)
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, full_name, password } = req.validatedData || req.body || {};

    const updated = await updateUserProfileModel(userId, { email, full_name, password });
    if (!updated) return res.status(404).json({ error: "User not found or nothing updated" });

    res.json({ message: "Profile updated", user: updated });
  } catch (error) {
    logger.critical("Update user profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = { follow, unfollow, myFollowing, myFollowers, followCounts, searchUsers, getUserProfile, updateUserProfile };
