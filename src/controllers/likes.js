// TODO: Implement likes controller
// This controller should handle:
// - Liking posts
// - Unliking posts
// - Getting likes for a post
// - Getting posts liked by a user

const logger = require("../utils/logger");
const {
	likePost,
	unlikePost,
	getPostLikes,
	getUserLikes,
	hasUserLikedPost,
} = require("../models/like");
const { getPostById } = require("../models/post"); // added

/**
 * POST /api/likes
 * body: { post_id: number }
 */
const like = async (req, res) => {
	try {
		const userId = req.user.id;
		const postId = parseInt(req.body.post_id, 10);
		if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });

		const post = await getPostById(postId);
		if (!post) return res.status(404).json({ error: "Post not found" });

		// Prevent liking own post
		if (post.user_id === userId) {
			return res.status(403).json({ error: "Cannot like your own post" });
		}

		const result = await likePost(userId, postId);
		if (!result.ok) {
			return res.json({ message: "Already liked" });
		}
		res.json({ message: "Post liked", like: result.row });
	} catch (error) {
		logger.critical("Like error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * DELETE /api/likes/:post_id
 */
const unlike = async (req, res) => {
	try {
		const userId = req.user.id;
		const postId = parseInt(req.params.post_id, 10);
		if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });

		const post = await getPostById(postId);
		if (!post) return res.status(404).json({ error: "Post not found" });

		// Prevent unliking own post
		if (post.user_id === userId) {
			return res.status(403).json({ error: "Cannot unlike your own post" });
		}

		const ok = await unlikePost(userId, postId);
		if (!ok) return res.status(404).json({ error: "Like not found" });

		res.json({ message: "Unliked" });
	} catch (error) {
		logger.critical("Unlike error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * GET /api/likes/post/:post_id
 * optional auth allowed
 */
const postLikes = async (req, res) => {
	try {
		const postId = parseInt(req.params.post_id, 10);
		if (Number.isNaN(postId)) return res.status(400).json({ error: "Invalid post id" });

		const page = parseInt(req.query.page, 10) || 1;
		const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
		const offset = (page - 1) * limit;

		const rows = await getPostLikes(postId, limit, offset);
		const likedByUser = req.user ? await hasUserLikedPost(req.user.id, postId) : false;

		res.json({ likes: rows, likedByUser, pagination: { page, limit, hasMore: rows.length === limit } });
	} catch (error) {
		logger.critical("Get post likes error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

/**
 * GET /api/likes/user/:user_id
 */
const userLikes = async (req, res) => {
	try {
		const userId = parseInt(req.params.user_id || (req.user && req.user.id), 10);
		if (Number.isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });

		const page = parseInt(req.query.page, 10) || 1;
		const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
		const offset = (page - 1) * limit;

		const rows = await getUserLikes(userId, limit, offset);
		res.json({ likedPosts: rows, pagination: { page, limit, hasMore: rows.length === limit } });
	} catch (error) {
		logger.critical("Get user likes error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

module.exports = {
	like,
	unlike,
	postLikes,
	userLikes,
};
