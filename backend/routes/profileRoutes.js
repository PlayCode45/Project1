const express = require("express");
const { 
  getLearnerProfile, 
  updateLearnerProfile, 
  getTeacherProfile, 
  updateTeacherProfile 
} = require("../controllers/profileController");
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// Set up storage for profile images
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    await fs.ensureDir(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Set up file filter to only accept image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

// Initialize upload middleware
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Middleware to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Apply authentication middleware
router.use(protect);

// Learner Profile Routes
router.get("/learner/:id", asyncHandler(getLearnerProfile));
router.put("/learner/:id", upload.single('profileImage'), asyncHandler(updateLearnerProfile));

// Teacher Profile Routes
router.get("/teacher/:id", asyncHandler(getTeacherProfile));
router.put("/teacher/:id", upload.single('profileImage'), asyncHandler(updateTeacherProfile));

module.exports = router; 