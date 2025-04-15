const mongoose = require('mongoose');

const watchedVideoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  videoId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Video',
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  lastPosition: {
    type: Number, // Time position in seconds
    default: 0
  },
  progress: {
    type: Number, // Percentage of video watched (0-100)
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index for userId and videoId to ensure uniqueness
watchedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

module.exports = mongoose.model('WatchedVideo', watchedVideoSchema); 