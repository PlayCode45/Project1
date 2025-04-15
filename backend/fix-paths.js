const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs-extra');

// Load environment variables
dotenv.config();

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import Video model
const Video = require('./models/Video');

// Fix file paths
async function fixFilePaths() {
  try {
    console.log('Starting path fixing process...');
    
    // Get all videos
    const videos = await Video.find({});
    console.log(`Found ${videos.length} videos to check`);
    
    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(__dirname, 'uploads');
    const videosDir = path.join(uploadDir, 'videos');
    const thumbnailsDir = path.join(uploadDir, 'thumbnails');
    
    [uploadDir, videosDir, thumbnailsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
    
    // Current and correct paths
    const oldBasePath = 'C:\\Users\\Admin\\Desktop\\Demo\\proj\\backend';
    const newBasePath = path.resolve(__dirname);
    
    console.log('Old base path:', oldBasePath);
    console.log('New base path:', newBasePath);
    
    // Fix paths for each video
    let updated = 0;
    
    for (const video of videos) {
      let isModified = false;
      
      // Fix video file path
      if (video.filePath && video.filePath.includes(oldBasePath)) {
        const newPath = video.filePath.replace(oldBasePath, newBasePath);
        console.log(`Updating path for video ${video._id}:`);
        console.log(`  From: ${video.filePath}`);
        console.log(`  To:   ${newPath}`);
        
        video.filePath = newPath;
        isModified = true;
      }
      
      // Fix thumbnail path
      if (video.thumbnailPath && video.thumbnailPath.includes(oldBasePath)) {
        const newPath = video.thumbnailPath.replace(oldBasePath, newBasePath);
        console.log(`Updating thumbnail path for video ${video._id}:`);
        console.log(`  From: ${video.thumbnailPath}`);
        console.log(`  To:   ${newPath}`);
        
        video.thumbnailPath = newPath;
        isModified = true;
      }
      
      // Save if modified
      if (isModified) {
        await video.save();
        updated++;
      }
    }
    
    console.log(`Updated paths for ${updated} videos`);
    console.log('Path fixing completed!');
    
  } catch (err) {
    console.error('Error fixing paths:', err);
  } finally {
    mongoose.disconnect();
  }
}

// Run the function
fixFilePaths(); 