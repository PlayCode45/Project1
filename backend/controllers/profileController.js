const User = require("../models/User");
const LearnerProfile = require("../models/LearnerProfile");
const TeacherProfile = require("../models/TeacherProfile");
const fs = require('fs-extra');
const path = require('path');

// @desc   Get Learner Profile
// @route  GET /api/profiles/learner/:id
const getLearnerProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the learner profile
    const profile = await LearnerProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: "Learner profile not found" 
      });
    }
    
    // If profile has an image, construct the full URL
    if (profile.profileImagePath) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profile.profileImageUrl = `${baseUrl}/uploads/profiles/${path.basename(profile.profileImagePath)}`;
    }
    
    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error("Error fetching learner profile:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving learner profile",
      error: error.message
    });
  }
};

// @desc   Update Learner Profile
// @route  PUT /api/profiles/learner/:id
const updateLearnerProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Find the user to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // If user email or username is being updated, update the User model too
    if (updateData.email || updateData.username) {
      await User.findByIdAndUpdate(userId, { 
        email: updateData.email || user.email,
        username: updateData.username || user.username
      });
    }
    
    // Prepare profile data - map field names as needed
    const profileData = {
      fullName: updateData.username || updateData.fullName,
      email: updateData.email,
      bio: updateData.bio,
      location: updateData.location,
      contact: updateData.contact
    };
    
    // Handle profile image if provided
    if (req.file) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/profiles');
      await fs.ensureDir(uploadsDir);
      
      // Set image path and URL
      const imagePath = req.file.path;
      const imageFilename = req.file.filename;
      
      // Add image data to profile
      profileData.profileImagePath = imagePath;
      profileData.profileImageName = imageFilename;
      
      // Generate image URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profileData.profileImageUrl = `${baseUrl}/uploads/profiles/${imageFilename}`;
    }
    
    // Find and update the profile, create if it doesn't exist
    let profile = await LearnerProfile.findOne({ user: userId });
    
    if (profile) {
      profile = await LearnerProfile.findOneAndUpdate(
        { user: userId },
        { $set: profileData },
        { new: true }
      );
    } else {
      profile = new LearnerProfile({
        user: userId,
        ...profileData
      });
      await profile.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Learner profile updated successfully",
      profile
    });
  } catch (error) {
    console.error("Error updating learner profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating learner profile",
      error: error.message
    });
  }
};

// @desc   Get Teacher Profile
// @route  GET /api/profiles/teacher/:id
const getTeacherProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the teacher profile
    const profile = await TeacherProfile.findOne({ user: userId });
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: "Teacher profile not found" 
      });
    }
    
    // If profile has an image, construct the full URL
    if (profile.profileImagePath) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profile.profileImageUrl = `${baseUrl}/uploads/profiles/${path.basename(profile.profileImagePath)}`;
    }
    
    res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving teacher profile",
      error: error.message
    });
  }
};

// @desc   Update Teacher Profile
// @route  PUT /api/profiles/teacher/:id
const updateTeacherProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Find the user to ensure it exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // If user email or username is being updated, update the User model too
    if (updateData.email || updateData.username) {
      await User.findByIdAndUpdate(userId, { 
        email: updateData.email || user.email,
        username: updateData.username || user.username
      });
    }
    
    // Prepare profile data - map field names as needed
    const profileData = {
      fullName: updateData.username || updateData.fullName,
      email: updateData.email,
      bio: updateData.bio,
      location: updateData.location,
      contact: updateData.contact
    };
    
    // Handle profile image if provided
    if (req.file) {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../uploads/profiles');
      await fs.ensureDir(uploadsDir);
      
      // Set image path and URL
      const imagePath = req.file.path;
      const imageFilename = req.file.filename;
      
      // Add image data to profile
      profileData.profileImagePath = imagePath;
      profileData.profileImageName = imageFilename;
      
      // Generate image URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      profileData.profileImageUrl = `${baseUrl}/uploads/profiles/${imageFilename}`;
    }
    
    // Find and update the profile, create if it doesn't exist
    let profile = await TeacherProfile.findOne({ user: userId });
    
    if (profile) {
      profile = await TeacherProfile.findOneAndUpdate(
        { user: userId },
        { $set: profileData },
        { new: true }
      );
    } else {
      profile = new TeacherProfile({
        user: userId,
        ...profileData
      });
      await profile.save();
    }
    
    res.status(200).json({
      success: true,
      message: "Teacher profile updated successfully",
      profile
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating teacher profile",
      error: error.message
    });
  }
};

// @desc   Create Initial Profile After Registration
// @route  Internal function
const createInitialProfile = async (userId, username, email, role) => {
  try {
    // Prepare initial profile data
    const profileData = {
      user: userId,
      fullName: username,
      email: email,
      bio: "",
      location: "",
      contact: "",
      profileImagePath: "",
      profileImageName: "",
      profileImageUrl: ""
    };
    
    if (role === "Learner") {
      const learnerProfile = new LearnerProfile(profileData);
      await learnerProfile.save();
    } else if (role === "Teacher") {
      const teacherProfile = new TeacherProfile(profileData);
      await teacherProfile.save();
    }
    return true;
  } catch (error) {
    console.error("Error creating initial profile:", error);
    return false;
  }
};

module.exports = {
  getLearnerProfile,
  updateLearnerProfile,
  getTeacherProfile,
  updateTeacherProfile,
  createInitialProfile
}; 