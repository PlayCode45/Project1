const mongoose = require('mongoose');

const BookmarkedVideoSchema = new mongoose.Schema({
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
  bookmarkedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Create compound index to ensure a user can bookmark a video only once
BookmarkedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const BookmarkedVideo = mongoose.model('BookmarkedVideo', BookmarkedVideoSchema);

module.exports = BookmarkedVideo; 