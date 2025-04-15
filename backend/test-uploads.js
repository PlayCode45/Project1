const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5002;

// Enable CORS
app.use(cors());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const videoDir = path.join(uploadsDir, 'videos');
const thumbnailDir = path.join(uploadsDir, 'thumbnails');

[uploadsDir, videoDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)){
  fs.mkdirSync(publicDir, { recursive: true });
  console.log(`Created directory: ${publicDir}`);
}

// Log all existing videos
try {
  const files = fs.readdirSync(videoDir);
  console.log('Available videos:', files);
} catch (err) {
  console.error('Error reading video directory:', err);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Root endpoint - redirect to the test page
app.get('/', (req, res) => {
  res.redirect('/test-video.html');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'File server is running' });
});

// Endpoint to list all available videos
app.get('/api/list-videos', (req, res) => {
  try {
    const videoFiles = fs.readdirSync(videoDir);
    res.json({ videos: videoFiles });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read video directory' });
  }
});

app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
  console.log(`Test page is available at http://localhost:${PORT}/test-video.html`);
  console.log(`Videos are available at http://localhost:${PORT}/uploads/videos/`);
}); 