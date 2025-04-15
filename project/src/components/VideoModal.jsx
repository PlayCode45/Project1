import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaEye, FaClock, FaStar, FaUser } from 'react-icons/fa';
import '../styles/VideoModal.css';

const VideoModal = ({ videoId, isOpen, onClose, userId }) => {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const modalRef = useRef();
  const videoRef = useRef();

  useEffect(() => {
    // Handle escape key press
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  useEffect(() => {
    // Handle click outside modal to close it
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const fetchVideoData = async () => {
      if (!videoId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch video data from API
        const response = await fetch(`http://localhost:5001/api/videos/${videoId}`, {
          headers: {
            'UserId': userId || ''
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch video data');
        }
        
        const data = await response.json();
        setVideo(data.video);

        // Increment video views
        incrementVideoViews(videoId);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isOpen && videoId) {
      fetchVideoData();
    }
  }, [isOpen, videoId, userId]);

  const incrementVideoViews = async (id) => {
    try {
      const response = await fetch(`http://localhost:5001/api/videos/${id}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        // Update the view count in the UI
        setVideo(prevVideo => {
          if (prevVideo) {
            return {
              ...prevVideo,
              views: (prevVideo.views || 0) + 1
            };
          }
          return prevVideo;
        });
      } else {
        console.error('Failed to increment view count');
      }
    } catch (err) {
      console.error('Error incrementing view count:', err);
    }
  };

  const handleVideoError = () => {
    setVideoError(true);
  };

  const retryPlayback = () => {
    setVideoError(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  // Get the appropriate video file type
  const getVideoType = (url) => {
    if (!url) return 'video/mp4';
    
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      default:
        return 'video/mp4';
    }
  };

  // Create proper video URL to access files from backend uploads
  const getVideoUrl = (fileUrl) => {
    if (!fileUrl) {
      console.log('No file URL provided');
      return '';
    }
    
    console.log('Original file URL:', fileUrl);
    
    // If it's already a complete URL, use it directly
    if (fileUrl.startsWith('http')) {
      console.log('Using complete URL:', fileUrl);
      return fileUrl;
    }
    
    // Extract the filename
    let filename = fileUrl;
    if (fileUrl.includes('/')) {
      const parts = fileUrl.split('/');
      filename = parts[parts.length - 1];
    }
    
    // Return URLs in order of preference - the video component will try these in order
    return [
      // Direct video endpoint
      `http://localhost:5001/video/${filename}`,
      // Static file serving
      `http://localhost:5001/uploads/videos/${filename}`,
      // Original path with domain
      `http://localhost:5001/${fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl}`
    ][0];  // Return the first URL for now
  };
  
  // For debugging and error handling
  useEffect(() => {
    if (video?.fileUrl) {
      console.log('Video details:', {
        id: video._id,
        title: video.title,
        fileName: video.fileName,
        filePath: video.filePath,
        fileUrl: video.fileUrl
      });
      
      // Test if the video file is accessible
      const videoUrl = getVideoUrl(video.fileUrl);
      fetch(videoUrl, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            console.log('Video file is accessible at:', videoUrl);
          } else {
            console.error(`Video file not found at ${videoUrl}. Status:`, response.status);
            // Try alternative paths
            console.log('You may need to check if the file exists at this path on your server');
          }
        })
        .catch(err => {
          console.error('Error checking video file:', err);
        });
    }
  }, [video]);

  if (!isOpen) return null;

  return (
    <div className="video-modal-overlay">
      <div ref={modalRef} className="video-modal-container">
        <button onClick={onClose} className="close-modal-button">
          <FaTimes />
        </button>
        
        {loading ? (
          <div className="video-modal-loader">Loading video...</div>
        ) : error ? (
          <div className="video-modal-error">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={onClose} className="retry-button">Close</button>
          </div>
        ) : (
          <>
            <div className="video-modal-player-wrapper">
              <video 
                ref={videoRef}
                className="video-modal-player"
                controls
                autoPlay
                onError={(e) => {
                  console.error('Video error:', e);
                  console.log('Trying alternative video source...');
                  
                  if (videoRef.current) {
                    const currentSrc = videoRef.current.querySelector('source').src;
                    console.log('Current source:', currentSrc);
                    
                    // Try all possible URLs
                    if (video?.fileUrl) {
                      // Extract the filename
                      const filename = video.fileUrl.includes('/') 
                        ? video.fileUrl.split('/').pop() 
                        : video.fileUrl;
                      
                      // Define all possible URLs to try
                      const possibleUrls = [
                        `http://localhost:5001/video/${filename}`, // Direct endpoint
                        `http://localhost:5001/uploads/videos/${filename}`, // Static file
                        `http://localhost:5001/${video.fileUrl.startsWith('/') ? video.fileUrl.substring(1) : video.fileUrl}`, // Original path
                        `http://localhost:5002/video/${filename}`, // Backup server endpoint
                        `http://localhost:5002/uploads/videos/${filename}` // Backup server static file
                      ];
                      
                      // Find the index of the current URL
                      const currentIndex = possibleUrls.findIndex(url => url === currentSrc);
                      
                      // If we can try the next URL
                      if (currentIndex < possibleUrls.length - 1) {
                        const nextUrl = possibleUrls[currentIndex + 1];
                        console.log(`Trying next URL (${currentIndex + 1}/${possibleUrls.length}):`, nextUrl);
                        
                        videoRef.current.querySelector('source').src = nextUrl;
                        videoRef.current.load();
                        return;
                      }
                    }
                  }
                  
                  // If all URLs failed, show error
                  handleVideoError();
                }}
              >
                <source 
                  src={getVideoUrl(video?.fileUrl)} 
                  type={getVideoType(video?.fileUrl)}
                />
                Your browser does not support the video tag.
              </video>
              
              {videoError && (
                <div className="video-error-overlay">
                  <h3>Video playback error</h3>
                  <p>There was a problem playing this video.</p>
                  <div>
                    <button onClick={retryPlayback} className="retry-button">Retry</button>
                    <button onClick={onClose} className="retry-button" style={{marginLeft: '10px', backgroundColor: '#6b7280'}}>Close</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="video-modal-details">
              <h2 className="video-modal-title">{video?.title}</h2>
              
              <div className="video-modal-meta">
                <div className="meta-item">
                  <FaEye />
                  <span>{video?.views || 0} views</span>
                </div>
                {video?.duration && (
                  <div className="meta-item">
                    <FaClock />
                    <span>{video?.duration}</span>
                  </div>
                )}
                {video?.rating && (
                  <div className="meta-item">
                    <FaStar style={{color: '#fbbf24'}} />
                    <span>{video?.rating}</span>
                  </div>
                )}
                {video?.category && (
                  <div className="meta-item category-badge">
                    {video.category}
                  </div>
                )}
              </div>
              
              <div className="video-modal-description">
                <h3>Description</h3>
                <p>{video?.description}</p>
              </div>
              
              {video?.teacher && (
                <div className="video-modal-instructor">
                  <h3>Instructor</h3>
                  <div className="instructor-info">
                    <div className="instructor-avatar">
                      {video.teacher.username ? video.teacher.username.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                      <p className="instructor-name">{video.teacher.username}</p>
                      <p className="instructor-title">Sign Language Instructor</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VideoModal; 