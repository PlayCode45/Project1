import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBookmark, FaEye, FaCalendarAlt, FaExclamationTriangle, FaUser, FaEnvelope, FaPlay } from 'react-icons/fa';
import '../styles/VideoPlayer.css';

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const videoRef = useRef(null);
  const [user, setUser] = useState(null);
  const [directDownloadUrl, setDirectDownloadUrl] = useState('');
  const [relatedVideos, setRelatedVideos] = useState([]);
  
  // Check if videoId is valid
  useEffect(() => {
    console.log("VideoPlayer mounted with videoId:", videoId);
    if (!videoId) {
      console.error("VideoPlayer: No videoId parameter found");
      navigate("/learner/dashboard");
      return;
    }
  }, [videoId, navigate]);
  
  // Check authentication and fetch video on mount
  useEffect(() => {
    // Exit if no videoId
    if (!videoId) return;
    
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
      console.error("VideoPlayer: No user found in localStorage");
      navigate("/signin");
      return;
    }
    setUser(currentUser);
    
    // Fetch video details
    fetchVideo(currentUser.id);
    
    // Fetch related videos
    fetchRelatedVideos(currentUser.id);
    // Check if the video is bookmarked
    checkBookmarkStatus(currentUser.id);
  }, [videoId, navigate]);
  
  // Listen for bookmark changes from other components (like LearnerDashboard)
  useEffect(() => {
    if (!videoId || !user) return;
    
    // Function to handle storage events
    const handleStorageChange = () => {
      const bookmarkActionString = localStorage.getItem('lastBookmarkAction');
      if (!bookmarkActionString) return;
      
      try {
        const bookmarkAction = JSON.parse(bookmarkActionString);
        
        // Check if this action applies to the current video
        if (bookmarkAction.videoId === videoId) {
          console.log('Detected bookmark change from Dashboard:', bookmarkAction);
          
          // Update UI if the bookmark state doesn't match
          if (bookmarkAction.isBookmarked !== isBookmarked) {
            console.log(`Updating bookmark state to ${bookmarkAction.isBookmarked}`);
            setIsBookmarked(bookmarkAction.isBookmarked);
          }
        }
      } catch (error) {
        console.error('Error processing bookmark action from storage:', error);
      }
    };
    
    // Check for changes on component mount
    handleStorageChange();
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (in case the user has the video player open in the same window as the dashboard)
    const interval = setInterval(handleStorageChange, 1000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [videoId, user, isBookmarked]);
  
  // Retry video playback when isRetrying state changes
  useEffect(() => {
    if (isRetrying && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        console.error("Error playing video after retry:", error);
        setVideoError(true);
      });
      setIsRetrying(false);
    }
  }, [isRetrying]);
  
  const fetchVideo = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      setVideoError(false);
      
      console.log("Fetching video with ID:", videoId);
      
      // Make sure videoId is valid
      if (!videoId) {
        throw new Error('Invalid video ID parameter');
      }
      
      const response = await fetch(`http://localhost:5001/api/videos/${videoId}`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video - Server responded with ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Video data received:', data);
      
      if (!data.video) {
        throw new Error('Video data not found in response');
      }
      
      if (!data.video.fileUrl) {
        throw new Error('Video file URL is missing');
      }
      
      setVideo(data.video);
      
      // Set direct download URL
      if (data.video.fileUrl) {
        setDirectDownloadUrl(getVideoUrl(data.video.fileUrl));
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      setError(error.message || 'Video not found or cannot be played');
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRelatedVideos = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/videos`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter out current video and limit to 4 videos
        const filtered = data.videos
          .filter(v => v._id !== videoId)
          .slice(0, 4)
          .map(video => ({
            ...video,
            thumbnailUrl: video.thumbnailUrl || "/placeholder.svg"
          }));
        setRelatedVideos(filtered);
      }
    } catch (error) {
      console.error('Error fetching related videos:', error);
    }
  };
  
  const incrementViewCount = async (userId, specificVideoId = null) => {
    try {
      const targetVideoId = specificVideoId || videoId;
      console.log('Incrementing view count for video:', targetVideoId);
      
      // Make API call to increment view count
      const response = await fetch(`http://localhost:5001/api/videos/${targetVideoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        console.log('View count incremented successfully');
        // Update local video data with incremented view count
        if (video && targetVideoId === videoId) {
          setVideo(prevVideo => ({
            ...prevVideo,
            views: (prevVideo.views || 0) + 1
          }));
        }
      } else {
        console.error('Failed to increment view count:', response.status);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };
  
  const handleVideoError = (e) => {
    console.error('Video playback error:', e);
    setVideoError(true);
    
    // Log detailed error information
    if (videoRef.current) {
      const videoElement = videoRef.current;
      console.error('Video element error details:', {
        error: videoElement.error,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState,
        src: videoElement.src,
        currentSrc: videoElement.currentSrc
      });
    }
    
    // Try to fetch a new URL or refresh the video data after a delay
    setTimeout(() => {
      if (user && videoId) {
        fetchVideo(user.id);
      }
    }, 3000);
  };
  
  const handleRetryPlayback = () => {
    setVideoError(false);
    setIsRetrying(true);
    
    // Reload the video data to get fresh URLs
    if (user && videoId) {
      fetchVideo(user.id);
    }
  };
  
  const toggleBookmark = async () => {
    try {
      if (!user) return;
      
      console.log(`Toggling bookmark for video ${videoId}`);
      
      // Make API call to toggle bookmark
      const method = isBookmarked ? 'DELETE' : 'POST';
      const response = await fetch(`http://localhost:5001/api/users/${user.id}/bookmarked-videos/${videoId}`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'UserId': user.id
        }
      });
      
      if (response.ok) {
        // Update local state
        const newBookmarkState = !isBookmarked;
        setIsBookmarked(newBookmarkState);
        
        // Store bookmark action in localStorage to communicate with other components
        const bookmarkAction = {
          videoId: videoId,
          isBookmarked: newBookmarkState,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('lastBookmarkAction', JSON.stringify(bookmarkAction));
        
        console.log(`Video ${videoId} ${isBookmarked ? 'removed from' : 'added to'} bookmarks`);
      } else {
        const errorData = await response.json();
        console.error("Error toggling bookmark:", errorData);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };

  const handleWatchRelatedVideo = (relatedVideoId) => {
    // Increment the view count first
    incrementViewCount(user.id, relatedVideoId);
    // Then navigate to the video
    navigate(`/video/${relatedVideoId}`);
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Format file URL to ensure it works correctly
  const getVideoUrl = (url) => {
    if (!url) return '';
    
    console.log("Processing video URL:", url);
    
    // If it's already a full URL, return it
    if (url.startsWith('http')) {
      console.log("URL is already absolute:", url);
      return url;
    }
    
    // Handle uploads directory path specifically
    if (url.includes('uploads/videos/')) {
      console.log("URL is from uploads directory with filename");
      // Extract the filename from the path
      const filename = url.split('/').pop();
      // Use the direct video endpoint
      const directUrl = `http://localhost:5001/video/${filename}`;
      console.log("Direct video URL:", directUrl);
      return directUrl;
    } else if (url.startsWith('videos/')) {
      console.log("URL is relative videos path");
      // Extract the filename from the path
      const filename = url.split('/').pop();
      // Use the direct video endpoint
      const directUrl = `http://localhost:5001/video/${filename}`;
      console.log("Direct video URL:", directUrl);
      return directUrl;
    }
    
    // If all else fails, try the streaming API with the video ID
    console.log("Using video ID for stream endpoint");
    const streamUrl = `http://localhost:5001/uploads/${url}`;
    console.log("Stream URL:", streamUrl);
    return streamUrl;
  };
  
  // Try to determine MIME type based on file extension
  const getMimeType = (url) => {
    if (!url) return 'video/mp4'; // Default
    
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      case 'mov':
        return 'video/quicktime';
      case 'avi':
        return 'video/x-msvideo';
      case 'wmv':
        return 'video/x-ms-wmv';
      default:
        return 'video/mp4';
    }
  };
  
  // Function to extract userId from localStorage
  const getUserIdFromLocalStorage = () => {
    // Try the user format first (most likely)
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser.id) {
          return parsedUser.id;
        }
      } catch (error) {
        console.error("Error parsing user:", error);
      }
    }
    
    // Try the userData format as fallback
    const userData = localStorage.getItem("userData");
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData.userId) {
          return parsedData.userId;
        }
      } catch (error) {
        console.error("Error parsing userData:", error);
      }
    }
    
    return null;
  };

  // Update the watch progress when video is played or paused
  useEffect(() => {
    if (!videoRef.current || !video) return;
    
    const videoElement = videoRef.current;
    
    // Function to update watch progress
    const updateWatchProgress = async () => {
      try {
        const userId = getUserIdFromLocalStorage();
        if (!userId) return;
        
        if (!videoElement) return;
        
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration || 0;
        
        // Calculate progress as percentage
        const progress = duration > 0 ? Math.floor((currentTime / duration) * 100) : 0;
        const isCompleted = progress > 90; // Consider completed if watched more than 90%
        
        console.log(`Updating watch progress: ${progress}%`);
        
        await fetch(`http://localhost:5001/api/videos/${videoId}/watch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'UserId': userId
          },
          body: JSON.stringify({
            lastPosition: currentTime,
            progress,
            isCompleted
          })
        });
      } catch (error) {
        console.error("Error updating watch progress:", error);
      }
    };
    
    // Add event listeners for timeupdate and pause events
    const handleTimeUpdate = () => {
      // Only update every 5 seconds to reduce API calls
      if (Math.floor(videoElement.currentTime) % 5 === 0) {
        updateWatchProgress();
      }
    };
    
    const handlePause = () => {
      updateWatchProgress();
    };
    
    const handleEnded = () => {
      updateWatchProgress();
    };
    
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    
    // Clean up event listeners
    return () => {
      if (videoElement) {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        updateWatchProgress(); // Update one last time when unmounting
      }
    };
  }, [videoRef.current, video, videoId]);
  
  // Add a function to check if the video is already bookmarked
  const checkBookmarkStatus = async (userId) => {
    try {
      console.log(`Checking bookmark status for video ${videoId} and user ${userId}`);
      
      // Fetch the user's bookmarked videos
      const response = await fetch(`http://localhost:5001/api/users/${userId}/bookmarked-videos`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if current video is in the bookmarked videos list
        const isVideoBookmarked = data.videos && data.videos.some(video => video._id === videoId);
        console.log(`Video ${videoId} bookmark status:`, isVideoBookmarked);
        setIsBookmarked(isVideoBookmarked);
      } else {
        console.error("Failed to fetch bookmark status:", response.status);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="video-player-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (error || !video) {
    return (
      <div className="video-player-container">
        <div className="video-player-error">
          <h2>Error</h2>
          <p>{error || 'Video not found'}</p>
          <button onClick={handleGoBack} className="go-back-button">
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }
  
  const videoUrl = getVideoUrl(video.fileUrl);
  const videoMimeType = getMimeType(video.fileUrl);
  
  return (
    <div className="video-player-page">
      <div className="video-player-header">
        <button onClick={handleGoBack} className="go-back-button">
          <FaArrowLeft /> Go Back
        </button>
        <h1 className="video-title-header">{video.title}</h1>
      </div>
      
      <div className="video-container">
        <div className="video-main-content">
          <div className="video-player-wrapper">
            {videoError ? (
              <div className="video-error-overlay">
                <FaExclamationTriangle size={48} />
                <p>Error playing this video. The file may be missing or in an unsupported format.</p>
                <div className="video-error-actions">
                  <button onClick={handleRetryPlayback} className="retry-button">
                    Try Again
                  </button>
                  {directDownloadUrl && (
                    <a 
                      href={directDownloadUrl} 
                      download 
                      className="download-button"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Video
                    </a>
                  )}
                </div>
              </div>
            ) : null}
            
            <video 
              ref={videoRef}
              poster={video.thumbnailUrl || '/placeholder.svg'}
              controls
              autoPlay
              onError={handleVideoError}
              controlsList="nodownload"
              className="video-player"
              preload="auto"
              playsInline
            >
              <source src={videoUrl} type={videoMimeType} />
              {videoMimeType !== 'video/mp4' && <source src={videoUrl} type="video/mp4" />}
              {videoMimeType !== 'video/webm' && <source src={videoUrl} type="video/webm" />}
              Your browser does not support the video tag.
            </video>
          </div>
          
          <div className="video-details">
            <div className="video-header">
              <h1 className="video-title">{video.title}</h1>
              <button 
                onClick={toggleBookmark}
                className="bookmark-button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  backgroundColor: isBookmarked ? "#fbbf24" : "#f3f4f6",
                  color: isBookmarked ? "white" : "#374151",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                <FaBookmark size={14} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
            
            <div className="video-meta">
              <div className="meta-item">
                <FaEye />
                <span>{video.views || 0} views</span>
              </div>
              <div className="meta-item">
                <FaCalendarAlt />
                <span>{formatDate(video.createdAt)}</span>
              </div>
              {video.category && (
                <div className="meta-item category-badge">
                  <span>{video.category}</span>
                </div>
              )}
            </div>
            
            <div className="video-description">
              <h3>Description</h3>
              <p>{video.description || 'No description available.'}</p>
            </div>
            
            <div className="video-instructor">
              <h3>Instructor</h3>
              <div className="instructor-info">
                <div className="instructor-avatar">
                  {video.teacher?.profileImageUrl ? (
                    <img 
                      src={video.teacher.profileImageUrl} 
                      alt="Instructor" 
                      className="instructor-avatar-img" 
                    />
                  ) : (
                    video.teacher?.username ? video.teacher.username.charAt(0).toUpperCase() : 'T'
                  )}
                </div>
                <div className="instructor-details">
                  <p className="instructor-name">{video.teacher?.username || 'Instructor'}</p>
                  <p className="instructor-title">Sign Language Teacher</p>
                  {video.teacher?.email && (
                    <p className="instructor-email">
                      <FaEnvelope size={12} className="email-icon" />
                      {video.teacher.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="related-videos">
          <h3>Related Videos</h3>
          <div className="related-videos-list">
            {relatedVideos.length > 0 ? (
              relatedVideos.map(relatedVideo => (
                <div 
                  key={relatedVideo._id} 
                  className="related-video-item"
                  onClick={() => handleWatchRelatedVideo(relatedVideo._id)}
                >
                  <div className="related-video-thumbnail">
                    <img 
                      src={relatedVideo.thumbnailUrl} 
                      alt={relatedVideo.title} 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <div className="play-overlay">
                      <FaPlay />
                    </div>
                  </div>
                  <div className="related-video-info">
                    <h4>{relatedVideo.title}</h4>
                    <p className="related-video-instructor">{relatedVideo.teacher?.username || 'Instructor'}</p>
                    <p className="related-video-views">{relatedVideo.views || 0} views</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-related-videos">No related videos found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer; 