const mongoose = require("mongoose");

const teacherProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  fullName: {
    type: String,
    default: ""
  },
  email: {
    type: String,
    default: ""
  },
  location: {
    type: String,
    default: ""
  },
  contact: {
    type: String,
    default: ""
  },
  bio: {
    type: String,
    default: ""
  },
  profileImagePath: {
    type: String,
    default: ""
  },
  profileImageName: {
    type: String,
    default: ""
  },
  profileImageUrl: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

const TeacherProfile = mongoose.model("TeacherProfile", teacherProfileSchema);

module.exports = TeacherProfile; 