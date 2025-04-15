const express = require('express');
const router = express.Router();
const { upload, checkFileSize } = require('../middleware/uploadMiddleware');
const videoController = require('../controllers/videoController');
const { protect, isTeacher } = require('../middleware/authMiddleware');
const fs = require('fs-extra');
const path = require('path');

// Apply authentication middleware
router.use(protect);

// Check upload directory status - for troubleshooting
router.get('/check-upload-dir', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '../uploads');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');
    const tempDir = path.join(__dirname, '../temp');
    
    const dirs = [
      { name: 'uploads', path: uploadDir, exists: fs.existsSync(uploadDir) },
      { name: 'videos', path: videosDir, exists: fs.existsSync(videosDir) },
      { name: 'thumbnails', path: thumbnailsDir, exists: fs.existsSync(thumbnailsDir) },
      { name: 'temp', path: tempDir, exists: fs.existsSync(tempDir) }
    ];
    
    res.status(200).json({
      success: true,
      message: 'Directory status checked',
      directories: dirs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking directories',
      error: error.message
    });
  }
});

// Upload video - only for teachers
router.post(
  '/upload',
  isTeacher,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  checkFileSize,
  videoController.uploadVideo
);

// Get all videos - accessible to both teachers and learners
router.get('/', videoController.getVideos);

// Get videos by teacher ID - accessible to both roles
router.get('/teacher/:teacherId', videoController.getTeacherVideos);

// Get current teacher's videos
router.get('/my-videos', isTeacher, videoController.getTeacherVideos);

// Get single video by ID
router.get('/:id', videoController.getVideoById);

// Update video - only owner can update
router.put(
  '/:id',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  checkFileSize,
  videoController.updateVideo
);

// Delete video - only owner or admin can delete
router.delete('/:id', videoController.deleteVideo);

// View count increment endpoint
router.post('/:id/view', videoController.incrementViewCount);

// Watch history route
router.post('/:videoId/watch', videoController.updateWatchHistory);

module.exports = router; 