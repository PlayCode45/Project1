import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaVideo, 
  FaUser, 
  FaBars, 
  FaSignOutAlt, 
  FaPlay,
  FaClock,
  FaStar,
  FaBookmark,
  FaSearch,
  FaEye,
  FaTrash
} from "react-icons/fa";
import "../styles/Dashboard.css";
import UserProfile from '../components/UserProfile';

const LearnerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    learningGoals: "",
    preferredLearningStyle: "visual"
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [watchedVideos, setWatchedVideos] = useState([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState([]);

  useEffect(() => {
    // Check if user is logged in and is a learner
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    
    // If user is a teacher, redirect to teacher dashboard
    if (currentUser.role === "Teacher") {
      navigate("/teacher/dashboard");
      return;
    }
    
    setUser(currentUser);
    
    // Fetch videos from API only once user is set
    fetchVideos(currentUser.id);
    
    // Fetch watched videos
    fetchWatchedVideos(currentUser.id);
    
    // Fetch bookmarked videos
    fetchBookmarkedVideos(currentUser.id);
    
    // Fetch learner profile data
    fetchLearnerProfile(currentUser.id);
  }, [navigate]);

  // Add a new useEffect to refresh watched videos when user returns to the dashboard
  useEffect(() => {
    const refreshData = () => {
      if (user && activeTab === "track-progress") {
        console.log("Refreshing watched videos data");
        fetchWatchedVideos(user.id);
      }
    };

    // Call once when the component mounts and tab changes
    refreshData();

    // Add event listener for when the window regains focus
    window.addEventListener('focus', refreshData);

    // Clean up
    return () => {
      window.removeEventListener('focus', refreshData);
    };
  }, [activeTab, user]);

  // Add listener for bookmark changes from other components (like VideoPlayer)
  useEffect(() => {
    // Function to handle storage events from VideoPlayer
    const handleStorageChange = () => {
      const bookmarkActionString = localStorage.getItem('lastBookmarkAction');
      if (!bookmarkActionString) return;
      
      try {
        const bookmarkAction = JSON.parse(bookmarkActionString);
        
        // Check if this is a new action we haven't processed yet
        const lastProcessedAction = localStorage.getItem('lastProcessedBookmarkAction');
        if (lastProcessedAction === bookmarkActionString) return;
        
        console.log('Detected bookmark change from VideoPlayer:', bookmarkAction);
        
        const { videoId, isBookmarked } = bookmarkAction;
        
        if (isBookmarked) {
          // Video was bookmarked, make sure it's in our bookmarkedVideos array
          if (!bookmarkedVideos.some(video => video._id === videoId)) {
            // Find the video in the videos array
            const videoToAdd = videos.find(video => video._id === videoId);
            if (videoToAdd) {
              console.log(`Adding video ${videoId} to bookmarks from external action`);
              setBookmarkedVideos(prevVideos => [...prevVideos, videoToAdd]);
              
              // Update the isBookmarked flag in the videos array
              setVideos(prevVideos => 
                prevVideos.map(video => 
                  video._id === videoId 
                    ? { ...video, isBookmarked: true }
                    : video
                )
              );
            }
          }
        } else {
          // Video was unbookmarked, remove it from our bookmarkedVideos array
          console.log(`Removing video ${videoId} from bookmarks from external action`);
          setBookmarkedVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
          
          // Update the isBookmarked flag in the videos array
          setVideos(prevVideos => 
            prevVideos.map(video => 
              video._id === videoId 
                ? { ...video, isBookmarked: false }
                : video
            )
          );
        }
        
        // Mark this action as processed
        localStorage.setItem('lastProcessedBookmarkAction', bookmarkActionString);
      } catch (error) {
        console.error('Error processing bookmark action from storage:', error);
      }
    };
    
    // Set initial value for lastProcessedBookmarkAction
    const initialAction = localStorage.getItem('lastBookmarkAction');
    if (initialAction) {
      localStorage.setItem('lastProcessedBookmarkAction', initialAction);
    }
    
    // Check for changes on component mount and when returning to this page
    handleStorageChange();
    
    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes (in case the user has the dashboard open in the same window as the video player)
    const interval = setInterval(handleStorageChange, 1000);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [videos, bookmarkedVideos]);

  const fetchVideos = async (userId) => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      console.log("Fetching videos for user ID:", userId);
      
      const response = await fetch(`http://localhost:5001/api/videos`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Videos fetched successfully:", data.videos?.length || 0, "videos");
        
        if (!data.videos || data.videos.length === 0) {
          console.log("No videos available");
          setVideos([]);
          return;
        }
        
        // Format the videos with all needed details
        const formattedVideos = data.videos.map(video => {
          // Ensure category is one of the three valid options
          let videoCategory = video.category || "Beginner";
          if (!["Beginner", "Intermediate", "Advanced"].includes(videoCategory)) {
            videoCategory = "Beginner";
          }
          
          return {
          ...video,
          thumbnailUrl: video.thumbnailUrl || `/placeholder.svg`,
          duration: video.duration || calculateDuration(video.fileSize),
          views: video.views || 0,
          rating: video.rating || 4.5,
            category: videoCategory,
          isBookmarked: false // This would ideally come from user bookmarks API
          };
        });
        
        setVideos(formattedVideos);
      } else {
        const errorText = await response.text();
        console.error(`Failed to fetch videos: ${response.status}`, errorText);
        setErrorMessage(`Failed to load videos: ${response.status} ${errorText || 'Unknown error'}`);
        setVideos([]);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      setErrorMessage(`Error: ${error.message || 'Could not connect to server'}`);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to estimate video duration based on file size
  const calculateDuration = (fileSize) => {
    if (!fileSize) return "10:00";
    // Rough estimation: 1MB ≈ 10 seconds of video at medium quality
    const seconds = Math.floor((fileSize / 1024 / 1024) * 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchLearnerProfile = async (userId) => {
    try {
      setIsLoading(true);
      console.log("Fetching learner profile for user ID:", userId);
      
      // Make API call to get learner profile
      const response = await fetch(`http://localhost:5001/api/profiles/learner/${userId}`, {
        headers: {
          'UserId': userId
        }
      });
      
      console.log("Profile fetch response:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data);
        
        // Update profile form with fetched data
        setProfileForm({
          fullName: data.profile.fullName || user?.username || "",
          email: data.profile.email || user?.email || "",
          bio: data.profile.bio || "",
          learningGoals: data.profile.learningGoals || "",
          preferredLearningStyle: data.profile.preferredLearningStyle || "visual"
        });
        
        // Update localStorage user data with profile information
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const updatedUser = { 
          ...currentUser,
          username: data.profile.fullName || currentUser.username,
          email: data.profile.email || currentUser.email,
          bio: data.profile.bio,
          location: data.profile.location,
          contact: data.profile.contact,
          profileImageUrl: data.profile.profileImageUrl || ""
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        console.log("Profile not found, initializing with defaults");
        // Initialize with user data if profile not found
        setProfileForm({
          fullName: user?.username || "",
          email: user?.email || "",
          bio: "",
          learningGoals: "",
          preferredLearningStyle: "visual"
        });
      }
    } catch (error) {
      console.error("Failed to fetch learner profile:", error);
      // Initialize with user data if profile not found
      setProfileForm({
        fullName: user?.username || "",
        email: user?.email || "",
        bio: "",
        learningGoals: "",
        preferredLearningStyle: "visual"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const fetchBookmarkedVideos = async (userId) => {
    try {
      setIsLoading(true);
      console.log("Fetching bookmarked videos for user ID:", userId);
      
      // Make API call to get bookmarked videos
      const response = await fetch(`http://localhost:5001/api/users/${userId}/bookmarked-videos`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing bookmarked videos response:", parseError);
          setBookmarkedVideos([]);
          return;
        }
        
        console.log("Bookmarked videos fetched successfully:", data.videos?.length || 0, "videos");
        
        if (!data.videos || data.videos.length === 0) {
          console.log("No bookmarked videos found");
          setBookmarkedVideos([]);
          return;
        }
        
        // Format the videos with needed details
        const formattedVideos = data.videos.map(video => {
          // Ensure thumbnailUrl is properly formatted
          let thumbnailUrl = video.thumbnailUrl || "/placeholder.svg";
          if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/')) {
            thumbnailUrl = `http://localhost:5001/uploads/${thumbnailUrl}`;
          }
          
          return {
            ...video,
            thumbnailUrl
          };
        });
        
        setBookmarkedVideos(formattedVideos);
      } else {
        // API responded with an error
        console.log("Bookmarked videos API error, status:", response.status);
        setBookmarkedVideos([]);
      }
    } catch (error) {
      console.error("Error fetching bookmarked videos:", error);
      setBookmarkedVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = async (videoId) => {
    try {
      if (!user) return;
      
      console.log(`Toggling bookmark for video ${videoId}`);
      
      // Check if the video is already bookmarked
      const isBookmarked = bookmarkedVideos.some(video => video._id === videoId);
      
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
        const newBookmarkState = !isBookmarked;
        
        if (isBookmarked) {
          // Remove from bookmarked videos
          setBookmarkedVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
          console.log(`Video ${videoId} removed from bookmarks`);
        } else {
          // Find the video from videos array
          const videoToAdd = videos.find(video => video._id === videoId);
          if (videoToAdd) {
            setBookmarkedVideos(prevVideos => [...prevVideos, videoToAdd]);
            console.log(`Video ${videoId} added to bookmarks`);
          }
        }
        
        // Also update the isBookmarked flag in the videos array
        setVideos(prevVideos => 
          prevVideos.map(video => 
      video._id === videoId 
              ? { ...video, isBookmarked: newBookmarkState }
        : video
          )
        );
        
        // Store bookmark action in localStorage to communicate with other components
        const bookmarkAction = {
          videoId: videoId,
          isBookmarked: newBookmarkState,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('lastBookmarkAction', JSON.stringify(bookmarkAction));
        localStorage.setItem('lastProcessedBookmarkAction', JSON.stringify(bookmarkAction));
      } else {
        const errorData = await response.json();
        console.error("Error toggling bookmark:", errorData);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  };

  const handleWatchVideo = (videoId) => {
    // Direct navigation with inc=true to increment view count
    navigate(`/video/${videoId}?inc=true`);
  };

  // Direct function to increment view count
  const incrementViewCount = async (videoId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    try {
      const userId = user?.id;
      if (!userId) return;
      
      console.log('Directly incrementing view count for video:', videoId);
      
      // Make API call to increment view count
      const response = await fetch(`http://localhost:5001/api/videos/${videoId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'UserId': userId
        }
      });
      
      if (response.ok) {
        console.log('View count incremented successfully');
        
        // Update local video data to reflect the change
        setVideos(prevVideos => 
          prevVideos.map(video => 
            video._id === videoId 
              ? { ...video, views: (video.views || 0) + 1 } 
              : video
          )
        );
        
        // Also update in other video lists if they exist
        if (watchedVideos.length > 0) {
          setWatchedVideos(prevVideos => 
            prevVideos.map(video => 
              video._id === videoId 
                ? { ...video, views: (video.views || 0) + 1 } 
                : video
            )
          );
        }
        
        if (bookmarkedVideos.length > 0) {
          setBookmarkedVideos(prevVideos => 
            prevVideos.map(video => 
              video._id === videoId 
                ? { ...video, views: (video.views || 0) + 1 } 
                : video
            )
          );
        }
        
        // Navigate to the video page
        navigate(`/video/${videoId}`);
      } else {
        console.error('Failed to increment view count:', response.status);
      }
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      console.log("Submitting profile update for user ID:", user.id);
      console.log("Profile data being sent:", profileForm);
      
      // Make API call to update learner profile
      const response = await fetch(`http://localhost:5001/api/profiles/learner/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'UserId': user.id
        },
        body: JSON.stringify(profileForm)
      });
      
      console.log("Profile update response status:", response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log("Profile update response data:", responseData);
        
        // Update local user data with all profile information
        const updatedUser = { 
          ...user, 
          username: profileForm.fullName, 
          email: profileForm.email,
          bio: profileForm.bio,
          location: profileForm.location,
          contact: profileForm.contact
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setSuccessMessage("Profile updated successfully!");
      } else {
        const errorData = await response.json();
        console.error("Profile update error:", errorData);
        setErrorMessage(errorData.message || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      }
    }
  };

  const getColorForCategory = (category) => {
    switch (category) {
      case "Beginner":
        return "#4f46e5";
      case "Intermediate":
        return "#fbbf24";
      case "Advanced":
        return "#ef4444";
      default:
        return "#f3f4f6";
    }
  };

  const fetchWatchedVideos = async (userId) => {
    try {
      setIsLoading(true);
      console.log("Fetching watched videos for user ID:", userId);
      
      // Make API call to get watched videos history
      const response = await fetch(`http://localhost:5001/api/users/${userId}/watched-videos`, {
        headers: {
          'UserId': userId || ''
        }
      });
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Error parsing watched videos response:", parseError);
          setWatchedVideos([]);
          return;
        }
        
        console.log("Watched videos fetched successfully:", data.videos?.length || 0, "videos");
        
        if (!data.videos || data.videos.length === 0) {
          console.log("No watched videos found");
          setWatchedVideos([]);
          return;
        }
        
        // Format the videos with all needed details
        const formattedVideos = data.videos.map(video => {
          // Ensure category is one of the three valid options
          let videoCategory = video.category || "Beginner";
          if (!["Beginner", "Intermediate", "Advanced"].includes(videoCategory)) {
            videoCategory = "Beginner";
          }
          
          // Ensure thumbnailUrl is properly formatted
          let thumbnailUrl = video.thumbnailUrl || "/placeholder.svg";
          if (thumbnailUrl && !thumbnailUrl.startsWith('http') && !thumbnailUrl.startsWith('/')) {
            thumbnailUrl = `http://localhost:5001/uploads/${thumbnailUrl}`;
          }
          
          return {
            ...video,
            thumbnailUrl,
            duration: video.duration || calculateDuration(video.fileSize),
            views: video.views || 0,
            category: videoCategory,
            watchedAt: video.watchedAt || video.updatedAt,
            progress: video.progress || 0
          };
        });
        
        // Sort by most recently watched
        formattedVideos.sort((a, b) => new Date(b.watchedAt) - new Date(a.watchedAt));
        
        setWatchedVideos(formattedVideos);
      } else {
        // API responded with an error
        console.log("Watched videos API error, status:", response.status);
        setWatchedVideos([]);
      }
    } catch (error) {
      console.error("Error fetching watched videos:", error);
      setWatchedVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromHistory = async (videoId) => {
    try {
      console.log(`Removing video ${videoId} from history`);
      
      // Make API call to delete the watched video record
      const response = await fetch(`http://localhost:5001/api/users/${user.id}/watched-videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'UserId': user.id
        }
      });
      
      if (response.ok) {
        // Update UI by removing the video from the watchedVideos state
        setWatchedVideos(prevVideos => prevVideos.filter(video => video._id !== videoId));
        console.log(`Video ${videoId} removed from history successfully`);
      } else {
        const errorData = await response.json();
        console.error("Error removing video from history:", errorData);
        alert("Failed to remove video from history. Please try again.");
      }
    } catch (error) {
      console.error("Error removing video from history:", error);
      alert("Failed to remove video from history. Please try again.");
    }
  };

  const isBookmarked = (videoId) => {
    return bookmarkedVideos.some(video => video._id === videoId);
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`dashboard-sidebar ${sidebarOpen ? "open" : "closed"} md:relative z-30`}>
        <div className="sidebar-logo">
          {sidebarOpen ? (
            <h2>EduSkill</h2>
          ) : (
            <h2>ES</h2>
          )}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle md:hidden lg:flex"
          >
            <FaBars />
          </button>
        </div>
        
        <div className="sidebar-nav">
          <button 
            onClick={() => setActiveTab("home")}
            className={`sidebar-button ${activeTab === "home" ? "active" : ""}`}
          >
            <FaHome className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Home</span>}
          </button>
          
          <button 
            onClick={() => {
              setActiveTab("track-progress");
              if (user) {
                fetchWatchedVideos(user.id);
              }
            }}
            className={`sidebar-button ${activeTab === "track-progress" ? "active" : ""}`}
          >
            <FaVideo className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">History</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("bookmarks")}
            className={`sidebar-button ${activeTab === "bookmarks" ? "active" : ""}`}
          >
            <FaBookmark className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Bookmarks</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("profile")}
            className={`sidebar-button ${activeTab === "profile" ? "active" : ""}`}
          >
            <FaUser className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Profile</span>}
          </button>
        </div>
        
        <div className="sidebar-footer">
          <button 
            onClick={handleLogout}
            className="sidebar-button"
          >
            <FaSignOutAlt className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Logout</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`dashboard-main ${sidebarOpen ? "open" : "closed"} w-full md:ml-0 lg:ml-[250px]`}>
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-content">
            <div className="flex items-center">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <FaBars />
              </button>
              <h1 className="header-title">
                {activeTab === "home" && "Home"}
                {activeTab === "track-progress" && "History"}
                {activeTab === "bookmarks" && "Bookmarks"}
                {activeTab === "profile" && "Profile Settings"}
            </h1>
            </div>
            
            {user && (
              <div className="user-profile">
                <div className="user-info hidden sm:block">
                  <p className="user-name">{user.username || "Learner"}</p>
                  <p className="user-email">{user.email || "learner@example.com"}</p>
                </div>
                <div className="user-avatar">
                  {user.profileImageUrl ? (
                    <img 
                      src={user.profileImageUrl} 
                      alt="Profile" 
                      className="user-avatar-image" 
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%"
                      }}
                    />
                  ) : (
                    user.username ? user.username.charAt(0).toUpperCase() : "L"
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="dashboard-content">
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading content...</p>
            </div>
          )}
          
          {errorMessage && (
            <div className="error-message">
              {errorMessage}
            </div>
          )}
          
          {activeTab === "home" && (
            <div>
              {/* Search */}
              <div className="dashboard-card search-container">
                <div className="search-wrapper">
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search videos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                  <div className="search-filter">
                    <select 
                      className="category-filter"
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      defaultValue=""
                    >
                      <option value="">All Categories</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Video Grid */}
              <div className="video-grid">
                {videos.length > 0 ? (
                  videos
                    .filter(video => {
                      const matchesSearch = video.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                           video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                           false;
                      const matchesCategory = !categoryFilter || video.category === categoryFilter;
                      return matchesSearch && matchesCategory;
                    })
                    .map((video) => (
                    <div key={video._id} className="video-card">
                      <div className="video-thumbnail" onClick={() => incrementViewCount(video._id)}>
                        <img
                          src={video.thumbnailUrl || "/placeholder.svg"}
                          alt={video.title || "Video"}
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "/placeholder.svg";
                            console.log(`Failed to load thumbnail for video: ${video._id}`);
                          }}
                        />
                        <div className="play-overlay">
                          <div className="play-button">
                            <FaPlay style={{ color: "white", fontSize: "20px", marginLeft: "3px" }} />
                          </div>
                        </div>
                        {video.category && (
                          <div className="video-category-badge" 
                            style={{backgroundColor: getColorForCategory(video.category || "Beginner")}}>
                            {video.category}
                          </div>
                        )}
                      </div>
                      <div className="video-info">
                        <h3 style={{fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem"}}>
                          {video.title || "Untitled Video"}
                        </h3>
                        <p style={{fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem"}}>
                          {video.teacher?.username || "Instructor"}
                        </p>
                        <p style={{fontSize: "0.875rem", color: "#4b5563", marginBottom: "0.75rem", lineHeight: "1.4", 
                           overflow: "hidden", 
                           display: "-webkit-box", 
                           WebkitLineClamp: "2", 
                           WebkitBoxOrient: "vertical"}}>
                          {video.description || "No description available"}
                        </p>
                        <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem"}}>
                          <span style={{fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center"}}>
                            <FaEye style={{marginRight: "0.25rem", fontSize: "0.75rem"}} />
                            {video.views} views
                          </span>
                          <span style={{fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center"}}>
                            <FaClock style={{marginRight: "0.25rem", fontSize: "0.75rem"}} />
                            {video.duration}
                          </span>
                        </div>
                        <div style={{display: "flex", gap: "0.5rem", marginTop: "auto"}}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementViewCount(video._id, e);
                            }}
                            className="watch-button"
                          >
                            <FaPlay size={12} />
                            Watch Now
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(video._id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isBookmarked(video._id) ? "#fbbf24" : "#f3f4f6",
                              color: isBookmarked(video._id) ? "white" : "#4b5563",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            <FaBookmark size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-videos-message">
                    <p>No videos found.</p>
                    <p>Try adjusting your search or filter.</p>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {activeTab === "track-progress" && (
            <div className="dashboard-card">
              <div className="video-grid">
                {watchedVideos.length > 0 ? (
                  watchedVideos.map((video) => (
                    <div key={video._id} className="video-card">
                      <div className="video-thumbnail" onClick={() => incrementViewCount(video._id)}>
                        <img
                          src={video.thumbnailUrl || "/placeholder.svg"}
                          alt={video.title || "Video"}
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "/placeholder.svg";
                            console.log(`Failed to load thumbnail for video: ${video._id}`);
                          }}
                        />
                        <div className="play-overlay">
                          <div className="play-button">
                            <FaPlay style={{ color: "white", fontSize: "20px", marginLeft: "3px" }} />
                          </div>
                        </div>
                        {video.category && (
                          <div className="video-category-badge" 
                            style={{backgroundColor: getColorForCategory(video.category || "Beginner")}}>
                            {video.category}
                          </div>
                        )}
                      </div>
                      <div className="video-info">
                        <h3 style={{fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem"}}>
                          {video.title || "Untitled Video"}
                        </h3>
                        <p style={{fontSize: "0.875rem", color: "#6b7280", marginBottom: "0.5rem"}}>
                          {video.teacher?.username || "Instructor"}
                        </p>
                        <div style={{display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.75rem"}}>
                          <span style={{fontSize: "0.875rem", color: "#6b7280", display: "flex", alignItems: "center"}}>
                            <FaEye style={{marginRight: "0.25rem", fontSize: "0.75rem"}} />
                            {video.views} views
                          </span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className={`progress-bar ${
                              video.progress >= 90 ? 'completed' : 
                              video.progress >= 60 ? 'high' : 
                              video.progress >= 30 ? 'medium' : 'low'
                            }`} 
                            style={{width: `${video.progress || 0}%`}}
                          ></div>
                        </div>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.75rem", color: "#6b7280"}}>
                          <span>Progress: {video.progress || 0}%</span>
                          <span>Watched: {new Date(video.watchedAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{display: "flex", gap: "0.5rem", marginTop: "auto"}}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementViewCount(video._id, e);
                            }}
                            className="watch-button"
                          >
                            <FaPlay size={12} />
                            Watch Now
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromHistory(video._id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#ef4444",
                              color: "white",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            <FaTrash size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-videos-message">
                    <p>You haven't watched any videos yet.</p>
                    <p>Your recently watched videos will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {activeTab === "bookmarks" && (
            <div className="dashboard-card">
              <div className="video-grid">
                {bookmarkedVideos.length > 0 ? (
                  bookmarkedVideos.map((video) => (
                    <div key={video._id} className="video-card">
                      <div className="video-thumbnail" onClick={() => incrementViewCount(video._id)}>
                        <img
                          src={video.thumbnailUrl || "/placeholder.svg"}
                          alt={video.title || "Video"}
                          onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "/placeholder.svg";
                            console.log(`Failed to load thumbnail for video: ${video._id}`);
                          }}
                        />
                        <div className="play-overlay">
                          <div className="play-button">
                            <FaPlay style={{ color: "white", fontSize: "20px", marginLeft: "3px" }} />
                          </div>
                        </div>
                        {video.category && (
                          <div className="video-category-badge" 
                            style={{backgroundColor: getColorForCategory(video.category || "Beginner")}}>
                            {video.category}
                          </div>
                        )}
                      </div>
                      <div className="video-info">
                        <h3 style={{fontSize: "1rem", fontWeight: "600", marginBottom: "1rem"}}>
                          {video.title || "Untitled Video"}
                        </h3>
                        <div style={{display: "flex", gap: "0.5rem", marginTop: "auto"}}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              incrementViewCount(video._id, e);
                            }}
                            className="watch-button"
                          >
                            <FaPlay size={12} />
                            Watch Now
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(video._id);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: isBookmarked(video._id) ? "#fbbf24" : "#f3f4f6",
                              color: isBookmarked(video._id) ? "white" : "#4b5563",
                              padding: "0.5rem",
                              borderRadius: "0.375rem",
                              fontSize: "0.875rem",
                              fontWeight: "500",
                              border: "none",
                              cursor: "pointer"
                            }}
                          >
                            <FaBookmark size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-videos-message">
                    <p>You haven't bookmarked any videos yet.</p>
                    <p>Bookmark videos to access them quickly later.</p>
                  </div>
                )}
              </div>
            </div>
          )}
            
          {activeTab === "profile" && (
            <div className="dashboard-content">
              <div className="content-header">
                <h2>Your Profile</h2>
              </div>
              <div className="profile-content">
                <UserProfile 
                  user={user} 
                  onProfileUpdate={async (profileData) => {
                    try {
                      console.log("Updating learner profile from UserProfile component", profileData);
                      
                      // Create FormData if it's not already a FormData object
                      const formData = profileData instanceof FormData 
                        ? profileData
                        : new FormData();
                      
                      // If not already FormData, add profile fields
                      if (!(profileData instanceof FormData)) {
                        Object.keys(profileData).forEach(key => {
                          formData.append(key, profileData[key]);
                        });
                      }
                      
                      const response = await fetch(`http://localhost:5001/api/profiles/learner/${user.id}`, {
                        method: 'PUT',
                        headers: {
                          'UserId': user.id
                          // Don't set Content-Type when using FormData; browser will set it with the boundary
                        },
                        body: formData
                      });
                      
                      console.log("Profile update response status:", response.status);
                      
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error("Error response text:", errorText);
                        
                        let errorData;
                        try {
                          errorData = JSON.parse(errorText);
                        } catch (e) {
                          throw new Error("Server error: " + errorText);
                        }
                        
                        throw new Error(errorData.message || "Failed to update profile");
                      }
                      
                      const responseData = await response.json();
                      console.log("Profile update response data:", responseData);
                      
                      // Update local user data with all profile information
                      const updatedUser = { 
                        ...user, 
                        username: profileData.username || profileData.get('username'), 
                        email: profileData.email || profileData.get('email'),
                        location: profileData.location || profileData.get('location'),
                        contact: profileData.contact || profileData.get('contact'),
                        bio: profileData.bio || profileData.get('bio'),
                        profileImageUrl: responseData.profile.profileImageUrl || user.profileImageUrl
                      };
                      localStorage.setItem("user", JSON.stringify(updatedUser));
                      setUser(updatedUser);
                      
                      return responseData;
                    } catch (error) {
                      console.error("Error updating profile:", error);
                      throw error;
                    }
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LearnerDashboard;
