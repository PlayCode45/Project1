const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Create required directories if they don't exist
const createDirectories = () => {
  const uploadDir = path.join(__dirname, '../uploads');
  const videosDir = path.join(uploadDir, 'videos');
  const thumbnailsDir = path.join(uploadDir, 'thumbnails');
  const tempDir = path.join(__dirname, '../temp');
  
  [uploadDir, videosDir, thumbnailsDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

// Create directories when middleware is loaded
createDirectories();

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'video') {
      cb(null, path.join(__dirname, '../uploads/videos'));
    } else if (file.fieldname === 'thumbnail') {
      cb(null, path.join(__dirname, '../uploads/thumbnails'));
    } else {
      cb(new Error('Invalid field name'), null);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'video') {
    // Accept only video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  } else if (file.fieldname === 'thumbnail') {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for thumbnails'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
    // Set a minimum file size for videos (10 bytes) to ensure we don't get empty files
    files: 2 // Maximum number of files (video + thumbnail)
  }
});

// Additional middleware to check for valid file sizes after upload
const checkFileSize = (req, res, next) => {
  if (!req.files) {
    return next();
  }
  
  // Check if video file has a valid size
  if (req.files.video && req.files.video.length > 0) {
    const videoFile = req.files.video[0];
    if (videoFile.size <= 0) {
      // Delete the empty file
      fs.unlinkSync(videoFile.path);
      return res.status(400).json({ 
        success: false,
        message: 'Empty video file detected. Please upload a valid video file.'
      });
    }
  }
  
  // Check if thumbnail file has a valid size
  if (req.files.thumbnail && req.files.thumbnail.length > 0) {
    const thumbnailFile = req.files.thumbnail[0];
    if (thumbnailFile.size <= 0) {
      // Delete the empty file
      fs.unlinkSync(thumbnailFile.path);
      return res.status(400).json({ 
        success: false,
        message: 'Empty thumbnail file detected. Please upload a valid image file.'
      });
    }
  }
  
  next();
};

module.exports = { upload, checkFileSize }; 