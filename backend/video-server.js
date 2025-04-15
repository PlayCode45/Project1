const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 5001;

// Enable CORS for all routes
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'UserId']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const videoDir = path.join(uploadsDir, 'videos');
const thumbnailDir = path.join(uploadsDir, 'thumbnails');

console.log('Uploads directory:', uploadsDir);
console.log('Videos directory:', videoDir);

[uploadsDir, videoDir, thumbnailDir].forEach(dir => {
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Log all existing videos
try {
  const files = fs.readdirSync(videoDir);
  console.log('Available videos:', files);
  
  if (files.length === 0) {
    console.log('WARNING: No video files found in the uploads/videos directory');
  }
} catch (err) {
  console.error('Error reading video directory:', err);
}

// Serve static files from uploads directory with proper headers
app.use('/uploads', (req, res, next) => {
  console.log(`Serving file: ${req.path}`);
  // Set headers to prevent caching issues
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  // Set correct MIME type for mp4 files
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.mp4') {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)){
  fs.mkdirSync(publicDir, { recursive: true });
  console.log(`Created directory: ${publicDir}`);
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Redirect root to the test page
app.get('/', (req, res) => {
  res.redirect('/video-test.html');
});

// Create a direct video endpoint
app.get('/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(videoDir, filename);
  
  console.log(`Attempting to serve video: ${filename}`);
  console.log(`Full path: ${videoPath}`);
  
  // Check if the file exists
  if (!fs.existsSync(videoPath)) {
    console.log(`File not found: ${videoPath}`);
    return res.status(404).send('Video not found');
  }
  
  // Get file stats
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  
  // Check for zero-sized files
  if (fileSize <= 0) {
    console.log(`Zero-sized file detected: ${videoPath}`);
    return res.status(404).send('Video file is empty or corrupted');
  }
  
  const range = req.headers.range;
  
  if (range) {
    // Handle range requests for video streaming
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    
    // Ensure the start position is valid
    if (isNaN(start) || start >= fileSize) {
      console.log(`Invalid range request: ${range} for file size ${fileSize}`);
      // Return the entire file if the range is invalid
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      return fs.createReadStream(videoPath).pipe(res);
    }
    
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    // Ensure the end position is valid
    const endPosition = Math.min(end, fileSize - 1);
    const chunksize = (endPosition - start) + 1;
    
    if (chunksize <= 0) {
      console.log(`Invalid chunk size: ${chunksize}`);
      // Return the entire file if the chunk size is invalid
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      });
      return fs.createReadStream(videoPath).pipe(res);
    }
    
    console.log(`Serving range request: ${start}-${endPosition}/${fileSize}`);
    
    const fileStream = fs.createReadStream(videoPath, {start, end: endPosition});
    const head = {
      'Content-Range': `bytes ${start}-${endPosition}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(206, head);
    fileStream.pipe(res);
  } else {
    // Serve the whole file
    console.log(`Serving full file: ${fileSize} bytes`);
    
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// A test endpoint to check server health
app.get('/api/test', (req, res) => {
  res.json({ message: 'Video server is running', timestamp: new Date().toISOString() });
});

// List all videos endpoint
app.get('/api/videos', (req, res) => {
  try {
    const files = fs.readdirSync(videoDir);
    res.json({ 
      videos: files.map(file => ({
        filename: file,
        url: `http://localhost:${PORT}/video/${file}`,
        directUrl: `http://localhost:${PORT}/uploads/videos/${file}`
      }))
    });
  } catch (err) {
    console.error('Error reading video directory:', err);
    res.status(500).json({ error: 'Failed to read videos directory' });
  }
});

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add route for testing video uploads
app.post('/api/upload-test-video', (req, res) => {
  // Create a small valid MP4 file with a proper header
  // This is a minimal valid MP4 header (ftyp box + free box)
  const mp4Header = Buffer.from([
    // ftyp box (24 bytes)
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp box header (8 bytes)
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x00, 0x01, // iso profile (8 bytes)
    0x69, 0x73, 0x6F, 0x6D, 0x61, 0x76, 0x63, 0x31, // compatible brands (8 bytes)
    
    // Add free box (16 bytes) to ensure we have enough content
    0x00, 0x00, 0x00, 0x10, 0x66, 0x72, 0x65, 0x65, // free box header (8 bytes)
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00  // free box content (8 bytes)
  ]);
  
  const testFilename = `test-video-${Date.now()}.mp4`;
  const filePath = path.join(videoDir, testFilename);
  
  // Write the test MP4 file to the videos directory
  try {
    fs.writeFileSync(filePath, mp4Header);
    console.log(`Created test video file: ${testFilename} (${mp4Header.length} bytes)`);
    
    // Verify file was written successfully
    const stats = fs.statSync(filePath);
    if (stats.size <= 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create test video - file is empty'
      });
    }
    
    // Return the video details
    res.json({
      success: true,
      filename: testFilename,
      fileSize: stats.size,
      url: `http://localhost:${PORT}/video/${testFilename}`,
      directUrl: `http://localhost:${PORT}/uploads/videos/${testFilename}`
    });
  } catch (err) {
    console.error('Error creating test video:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Video server running on port ${PORT}`);
  console.log(`Access videos at http://localhost:${PORT}/video/[filename]`);
  console.log(`Direct access at http://localhost:${PORT}/uploads/videos/[filename]`);
  console.log(`API test at http://localhost:${PORT}/api/test`);
  console.log(`List videos at http://localhost:${PORT}/api/videos`);
}); 