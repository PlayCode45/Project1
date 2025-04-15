const User = require('../models/User');

// Protect routes - only authenticated users can access
exports.protect = async (req, res, next) => {
  try {
    // Allow OPTIONS requests to pass through for CORS
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    let userId;
    
    // Check userid in headers (new approach)
    if (req.headers['userid']) {
      userId = req.headers['userid'];
    }
    // Check in authorization header too (fallback for existing code)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Try to extract user ID from auth header - assuming token is the user ID
      userId = req.headers.authorization.split(' ')[1];
    }
    
    // Check if userId exists
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized, no user ID provided' });
    }
    
    try {
      // Find user by ID
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Add user to request object
      req.user = user;
      
      next();
    } catch (error) {
      console.error('Auth verification error:', error);
      return res.status(401).json({ message: 'Not authorized, authentication failed' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check if user is a teacher
exports.isTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'Teacher') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as a teacher' });
  }
}; 