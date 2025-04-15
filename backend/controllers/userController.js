const User = require("../models/User");
const { createInitialProfile } = require("./profileController");
const mongoose = require("mongoose");
const WatchedVideo = require("../models/WatchedVideo");
const BookmarkedVideo = require("../models/BookmarkedVideo");

// @desc   Register User
// @route  POST /api/users/signup
const registerUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide all required fields" });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a valid email address" });
    }

    // Password length validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, message: "Password must be at least 6 characters long" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      username,
      email,
      password,
      role: role || "Learner",
    });

    await newUser.save();
    
    // Create initial profile
    await createInitialProfile(newUser._id, username, email, newUser.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error registering user",
      error: error.message,
    });
  }
};

// @desc   Sign In User
// @route  POST /api/users/signin
const signInUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Check password (direct comparison since no hashing is used)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    
    // Update lastLogin time
    user.lastLogin = new Date();
    await user.save();

    // Return user data without password
    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error signing in",
      error: error.message,
    });
  }
};

// Get watched videos
const getWatchedVideos = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if WatchedVideo model exists, if not handle gracefully
    if (!mongoose.modelNames().includes('WatchedVideo')) {
      console.log('WatchedVideo model not found, returning empty array');
      return res.status(200).json({ videos: [] });
    }
    
    console.log(`Fetching watched videos for userId: ${userId}`);
    
    // Find all watched videos for this user
    const watchedRecords = await WatchedVideo.find({ userId })
      .sort({ watchedAt: -1 }) // Sort by most recently watched
      .populate({
        path: 'videoId',
        select: 'title description thumbnailUrl fileUrl category createdAt updatedAt views teacher fileSize duration'
      }); // Populate to get the video details
    
    console.log(`Found ${watchedRecords.length} watched records`);
    
    if (!watchedRecords || watchedRecords.length === 0) {
      return res.status(200).json({ videos: [] });
    }
    
    // Format the response
    const videos = watchedRecords.map(record => {
      if (!record.videoId) {
        return null; // Skip if video no longer exists
      }
      
      // Return combined data from video and watch record
      const videoData = record.videoId.toObject();
      return {
        ...videoData,
        _id: videoData._id,
        watchedAt: record.watchedAt,
        progress: record.progress,
        lastPosition: record.lastPosition
      };
    }).filter(video => video !== null); // Remove null entries (deleted videos)
    
    console.log(`Returning ${videos.length} videos after filtering`);
    
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error getting watched videos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a video from watch history
const removeFromWatchHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const videoId = req.params.videoId;
    
    console.log(`Removing video ${videoId} from user ${userId}'s watch history`);
    
    if (!userId || !videoId) {
      return res.status(400).json({ message: 'User ID and Video ID are required' });
    }
    
    // Check if WatchedVideo model exists
    if (!mongoose.modelNames().includes('WatchedVideo')) {
      return res.status(404).json({ message: 'Watch history feature not available' });
    }
    
    // Find and delete the watch record
    const result = await WatchedVideo.findOneAndDelete({ 
      userId: userId, 
      videoId: videoId 
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Watch history record not found' });
    }
    
    console.log(`Successfully removed video ${videoId} from user ${userId}'s watch history`);
    
    res.status(200).json({ 
      success: true,
      message: 'Video removed from watch history successfully' 
    });
  } catch (error) {
    console.error('Error removing video from watch history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get bookmarked videos
const getBookmarkedVideos = async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Check if BookmarkedVideo model exists
    if (!mongoose.modelNames().includes('BookmarkedVideo')) {
      console.log('BookmarkedVideo model not found, returning empty array');
      return res.status(200).json({ videos: [] });
    }
    
    console.log(`Fetching bookmarked videos for userId: ${userId}`);
    
    // Find all bookmarked videos for this user
    const bookmarkRecords = await BookmarkedVideo.find({ userId })
      .sort({ bookmarkedAt: -1 }) // Sort by most recently bookmarked
      .populate({
        path: 'videoId',
        select: 'title description thumbnailUrl fileUrl category createdAt updatedAt views teacher fileSize duration'
      });
    
    console.log(`Found ${bookmarkRecords.length} bookmark records`);
    
    if (!bookmarkRecords || bookmarkRecords.length === 0) {
      return res.status(200).json({ videos: [] });
    }
    
    // Format the response
    const videos = bookmarkRecords.map(record => {
      if (!record.videoId) {
        return null; // Skip if video no longer exists
      }
      
      // Return video data with bookmark info
      const videoData = record.videoId.toObject();
      return {
        ...videoData,
        _id: videoData._id,
        bookmarkedAt: record.bookmarkedAt
      };
    }).filter(video => video !== null); // Remove null entries (deleted videos)
    
    console.log(`Returning ${videos.length} bookmarked videos after filtering`);
    
    res.status(200).json({ videos });
  } catch (error) {
    console.error('Error getting bookmarked videos:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add video to bookmarks
const addToBookmarks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const videoId = req.params.videoId;
    
    console.log(`Adding video ${videoId} to user ${userId}'s bookmarks`);
    
    if (!userId || !videoId) {
      return res.status(400).json({ message: 'User ID and Video ID are required' });
    }
    
    // Check if video exists
    const Video = mongoose.model('Video');
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if already bookmarked
    const existingBookmark = await BookmarkedVideo.findOne({ userId, videoId });
    if (existingBookmark) {
      return res.status(200).json({ 
        success: true,
        message: 'Video is already bookmarked',
        bookmarked: true
      });
    }
    
    // Create new bookmark
    const newBookmark = new BookmarkedVideo({
      userId,
      videoId,
      bookmarkedAt: new Date()
    });
    
    await newBookmark.save();
    
    console.log(`Successfully added video ${videoId} to user ${userId}'s bookmarks`);
    
    res.status(201).json({ 
      success: true,
      message: 'Video bookmarked successfully',
      bookmarked: true
    });
  } catch (error) {
    console.error('Error adding bookmark:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove video from bookmarks
const removeFromBookmarks = async (req, res) => {
  try {
    const userId = req.params.userId;
    const videoId = req.params.videoId;
    
    console.log(`Removing video ${videoId} from user ${userId}'s bookmarks`);
    
    if (!userId || !videoId) {
      return res.status(400).json({ message: 'User ID and Video ID are required' });
    }
    
    // Find and delete the bookmark
    const result = await BookmarkedVideo.findOneAndDelete({ 
      userId: userId, 
      videoId: videoId 
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }
    
    console.log(`Successfully removed video ${videoId} from user ${userId}'s bookmarks`);
    
    res.status(200).json({ 
      success: true,
      message: 'Video removed from bookmarks successfully',
      bookmarked: false
    });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerUser,
  signInUser,
  getWatchedVideos,
  removeFromWatchHistory,
  getBookmarkedVideos,
  addToBookmarks,
  removeFromBookmarks
};