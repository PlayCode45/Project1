const express = require("express");
const { 
  registerUser, 
  signInUser,
  getWatchedVideos,
  removeFromWatchHistory,
  getBookmarkedVideos,
  addToBookmarks,
  removeFromBookmarks
} = require("../controllers/userController");

const router = express.Router();

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// User Registration Route
router.post("/signup", asyncHandler(registerUser));

// User Login Route
router.post("/signin", asyncHandler(signInUser));

// Routes for watched videos
router.get('/:id/watched-videos', getWatchedVideos);
router.delete('/:userId/watched-videos/:videoId', asyncHandler(removeFromWatchHistory));

// Routes for bookmarked videos
router.get('/:id/bookmarked-videos', getBookmarkedVideos);
router.post('/:userId/bookmarked-videos/:videoId', asyncHandler(addToBookmarks));
router.delete('/:userId/bookmarked-videos/:videoId', asyncHandler(removeFromBookmarks));

module.exports = router;
