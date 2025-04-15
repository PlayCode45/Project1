const Video = require('../models/Video');
const User = require('../models/User');
const fs = require('fs-extra');
const path = require('path');
const WatchedVideo = require('../models/WatchedVideo');

// Upload a video
exports.uploadVideo = async (req, res) => {
  try {
    // Check if user is a teacher
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'Teacher') {
      // Delete uploaded files if user is not a teacher
      if (req.files && req.files.video) {
        await fs.remove(req.files.video[0].path);
      }
      if (req.files && req.files.thumbnail) {
        await fs.remove(req.files.thumbnail[0].path);
      }
      return res.status(403).json({ message: 'Only teachers can upload videos' });
    }

    // Validate required fields
    if (!req.body.title || !req.body.description) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.video) {
        await fs.remove(req.files.video[0].path);
      }
      if (req.files && req.files.thumbnail) {
        await fs.remove(req.files.thumbnail[0].path);
      }
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Check if video file was uploaded
    if (!req.files || !req.files.video || req.files.video.length === 0) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const videoFile = req.files.video[0];
    
    // Double-check file size (additional safety measure)
    if (videoFile.size <= 0) {
      await fs.remove(videoFile.path);
      return res.status(400).json({ message: 'Empty video file uploaded. Please try again with a valid file.' });
    }
    
    // Verify the video file exists on disk and has content
    try {
      const stats = await fs.stat(videoFile.path);
      if (stats.size <= 0) {
        await fs.remove(videoFile.path);
        return res.status(400).json({ message: 'Video file has no content. Please try again with a valid file.' });
      }
    } catch (err) {
      console.error('Error validating video file:', err);
      return res.status(400).json({ message: 'Failed to validate video file. Please try again.' });
    }
    
    // Construct the file paths and URLs for frontend
    const videoFilename = videoFile.filename;
    
    // Store only the relative path in the database (not the full URL)
    const videoRelativePath = `videos/${videoFilename}`;  // Store as a relative path
    
    // Create video document
    const videoData = {
      teacher: req.user.id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'Beginner',
      fileName: videoFilename,
      filePath: videoFile.path,
      fileUrl: videoRelativePath,  // Store just the relative path
      fileType: videoFile.mimetype,
      fileSize: videoFile.size
    };
    
    // Add thumbnail if provided
    if (req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      
      // Verify thumbnail file
      if (thumbnailFile.size <= 0) {
        await fs.remove(thumbnailFile.path);
        return res.status(400).json({ message: 'Empty thumbnail file uploaded. Please try again with a valid file.' });
      }
      
      const thumbnailFilename = thumbnailFile.filename;
      const thumbnailRelativePath = `thumbnails/${thumbnailFilename}`;
      
      videoData.thumbnailName = thumbnailFilename;
      videoData.thumbnailPath = thumbnailFile.path;
      videoData.thumbnailUrl = thumbnailRelativePath;  // Store just the relative path
    }
    
    // Save to database
    const video = new Video(videoData);
    await video.save();
    
    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        _id: video._id,
        title: video.title,
        description: video.description,
        category: video.category,
        fileUrl: video.fileUrl,
        thumbnailUrl: video.thumbnailUrl,
        createdAt: video.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Delete uploaded files if error occurs
    if (req.files && req.files.video) {
      try {
        await fs.remove(req.files.video[0].path);
      } catch (err) {
        console.error('Error deleting video file:', err);
      }
    }
    if (req.files && req.files.thumbnail) {
      try {
        await fs.remove(req.files.thumbnail[0].path);
      } catch (err) {
        console.error('Error deleting thumbnail file:', err);
      }
    }
    
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
};

// Get videos
exports.getVideos = async (req, res) => {
  try {
    // Query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Filter by category if provided
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Get total count
    const total = await Video.countDocuments(filter);
    
    // Get videos with pagination
    const videos = await Video.find(filter)
      .populate('teacher', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Add base URL to file paths
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
    const updatedVideos = videos.map(video => {
      const videoObj = video.toObject();
      // Update fileUrl if it's a relative path
      if (videoObj.fileUrl && !videoObj.fileUrl.startsWith('http')) {
        videoObj.fileUrl = `${baseUrl}/${videoObj.fileUrl}`;
      }
      // Update thumbnailUrl if it's a relative path
      if (videoObj.thumbnailUrl && !videoObj.thumbnailUrl.startsWith('http')) {
        videoObj.thumbnailUrl = `${baseUrl}/${videoObj.thumbnailUrl}`;
      }
      return videoObj;
    });
    
    res.status(200).json({
      success: true,
      count: videos.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      videos: updatedVideos
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
};

// Get videos by teacher
exports.getTeacherVideos = async (req, res) => {
  try {
    const teacherId = req.params.teacherId || req.user.id;
    
    const videos = await Video.find({ teacher: teacherId })
      .sort({ createdAt: -1 })
      .populate('teacher', 'username email');
      
    res.status(200).json({
      success: true,
      count: videos.length,
      videos
    });
  } catch (error) {
    console.error('Error fetching teacher videos:', error);
    res.status(500).json({ message: 'Error fetching teacher videos', error: error.message });
  }
};

// Get video by ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('teacher', 'username email');
      
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Verify the video file exists on disk
    const videoFilePath = video.filePath;
    if (!fs.existsSync(videoFilePath)) {
      console.error(`Video file not found on disk: ${videoFilePath}`);
      return res.status(404).json({ 
        message: 'Video file is missing from storage',
        videoId: video._id
      });
    }
    
    // Check if file has content
    const stats = fs.statSync(videoFilePath);
    if (stats.size === 0) {
      console.error(`Empty video file: ${videoFilePath}, size: ${stats.size} bytes`);
      return res.status(500).json({ 
        message: 'Video file exists but is empty',
        videoId: video._id
      });
    }
    
    // Convert to plain object and update URLs
    const videoObj = video.toObject();
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads`;
    
    // Update fileUrl if it's a relative path
    if (videoObj.fileUrl && !videoObj.fileUrl.startsWith('http')) {
      videoObj.fileUrl = `${baseUrl}/${videoObj.fileUrl}`;
    }
    
    // Update thumbnailUrl if it's a relative path
    if (videoObj.thumbnailUrl && !videoObj.thumbnailUrl.startsWith('http')) {
      videoObj.thumbnailUrl = `${baseUrl}/${videoObj.thumbnailUrl}`;
    }
    
    res.status(200).json({
      success: true,
      video: videoObj
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Error fetching video', error: error.message });
  }
};

// Delete video
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to delete
    if (video.teacher.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete this video' });
    }
    
    // Delete the video file
    if (await fs.pathExists(video.filePath)) {
      await fs.remove(video.filePath);
    }
    
    // Delete thumbnail if exists
    if (video.thumbnailPath && await fs.pathExists(video.thumbnailPath)) {
      await fs.remove(video.thumbnailPath);
    }
    
    // Remove from database
    await Video.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
};

// Increment view count
exports.incrementViewCount = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Simply increment the view count by 1
    video.views += 1;
    await video.save();
    
    res.status(200).json({
      success: true,
      message: 'View count incremented successfully',
      views: video.views
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    res.status(500).json({ message: 'Error incrementing view count', error: error.message });
  }
};

// Update a video
exports.updateVideo = async (req, res) => {
  try {
    // Check if video exists
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to update the video
    if (video.teacher.toString() !== req.user.id && req.user.role !== 'Admin') {
      // Delete uploaded files if user is not authorized
      if (req.files && req.files.video) {
        await fs.remove(req.files.video[0].path);
      }
      if (req.files && req.files.thumbnail) {
        await fs.remove(req.files.thumbnail[0].path);
      }
      return res.status(403).json({ message: 'Not authorized to update this video' });
    }

    // Validate required fields
    if (!req.body.title || !req.body.description) {
      // Delete uploaded files if validation fails
      if (req.files && req.files.video) {
        await fs.remove(req.files.video[0].path);
      }
      if (req.files && req.files.thumbnail) {
        await fs.remove(req.files.thumbnail[0].path);
      }
      return res.status(400).json({ message: 'Title and description are required' });
    }
    
    // Update video data
    const updatedData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || video.category
    };
    
    // Update video file if provided
    if (req.files && req.files.video && req.files.video.length > 0) {
      const videoFile = req.files.video[0];
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const videoUrl = `${baseUrl}/uploads/videos/${videoFile.filename}`;
      
      // Delete old video file
      if (await fs.pathExists(video.filePath)) {
        await fs.remove(video.filePath);
      }
      
      // Update video file data
      updatedData.fileName = videoFile.filename;
      updatedData.filePath = videoFile.path;
      updatedData.fileUrl = videoUrl;
      updatedData.fileType = videoFile.mimetype;
      updatedData.fileSize = videoFile.size;
    }
    
    // Update thumbnail if provided
    if (req.files && req.files.thumbnail && req.files.thumbnail.length > 0) {
      const thumbnailFile = req.files.thumbnail[0];
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const thumbnailUrl = `${baseUrl}/uploads/thumbnails/${thumbnailFile.filename}`;
      
      // Delete old thumbnail file
      if (video.thumbnailPath && await fs.pathExists(video.thumbnailPath)) {
        await fs.remove(video.thumbnailPath);
      }
      
      // Update thumbnail data
      updatedData.thumbnailName = thumbnailFile.filename;
      updatedData.thumbnailPath = thumbnailFile.path;
      updatedData.thumbnailUrl = thumbnailUrl;
    }
    
    // Save updated video
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId, 
      updatedData,
      { new: true } // Return the updated document
    ).populate('teacher', 'username email');
    
    res.status(200).json({
      success: true,
      message: 'Video updated successfully',
      video: updatedVideo
    });
  } catch (error) {
    console.error('Error updating video:', error);
    
    // Delete uploaded files if error occurs
    if (req.files && req.files.video) {
      try {
        await fs.remove(req.files.video[0].path);
      } catch (err) {
        console.error('Error deleting video file:', err);
      }
    }
    if (req.files && req.files.thumbnail) {
      try {
        await fs.remove(req.files.thumbnail[0].path);
      } catch (err) {
        console.error('Error deleting thumbnail file:', err);
      }
    }
    
    res.status(500).json({ message: 'Error updating video', error: error.message });
  }
};

// Update watch history
exports.updateWatchHistory = async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id || req.user._id || req.headers.userid; // Support different formats
    const { lastPosition, progress, isCompleted } = req.body;
    
    console.log(`Updating watch history for videoId: ${videoId}, userId: ${userId}`);
    
    // Verify the video exists
    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Find existing watch record or create new one
    let watchRecord = await WatchedVideo.findOne({ userId, videoId });
    
    if (watchRecord) {
      // Update existing record
      console.log("Updating existing watch record");
      watchRecord.lastPosition = lastPosition !== undefined ? lastPosition : watchRecord.lastPosition;
      watchRecord.progress = progress !== undefined ? progress : watchRecord.progress;
      watchRecord.isCompleted = isCompleted !== undefined ? isCompleted : watchRecord.isCompleted;
      watchRecord.watchedAt = new Date(); // Update watched timestamp
    } else {
      // Create new watch record
      console.log("Creating new watch record");
      watchRecord = new WatchedVideo({
        userId,
        videoId,
        lastPosition: lastPosition || 0,
        progress: progress || 0,
        isCompleted: isCompleted || false
      });
    }
    
    await watchRecord.save();
    
    console.log("Watch record saved successfully");
    
    res.status(200).json({ 
      message: 'Watch history updated successfully',
      watchRecord
    });
  } catch (error) {
    console.error('Error updating watch history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 