const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const {
  follow,
  unfollow,
  myFollowing,
  myFollowers,
  followCounts,
  searchUsers,
  getUserProfile,
  updateUserProfile,
} = require("../controllers/users");

const router = express.Router();

/**
 * User-related routes
 */

// search users (allow public search)
router.get("/search", optionalAuth, searchUsers);

// current user's following/followers
router.get("/following", authenticateToken, myFollowing);
router.get("/followers", authenticateToken, myFollowers);

// get or update profile (profile view can be public)
router.get("/:user_id/profile", optionalAuth, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);

// follow/unfollow and stats
router.post("/:user_id/follow", authenticateToken, follow);
router.delete("/:user_id/unfollow", authenticateToken, unfollow);
// stats can be public
router.get("/:user_id/stats", optionalAuth, followCounts);

module.exports = router;
