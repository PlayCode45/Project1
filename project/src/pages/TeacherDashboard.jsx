import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaHome, 
  FaVideo, 
  FaUser, 
  FaBars, 
  FaSignOutAlt,
  FaPlay,
  FaEye,
  FaUsers,
  FaUpload,
  FaEdit,
  FaTrash
} from "react-icons/fa";
import "../styles/Dashboard.css";
import UserProfile from '../components/UserProfile';
import TeacherVideoUpload from '../components/dashboard/TeacherVideoUpload';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [showVideoOptions, setShowVideoOptions] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    bio: "",
    credentials: "",
    yearsOfExperience: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Check if user is logged in and is a teacher
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (!currentUser) {
      navigate("/signin");
      return;
    }
    
    // If user is a learner, redirect to learner dashboard
    if (currentUser.role === "Learner") {
      navigate("/learner/dashboard");
      return;
    }
    
    setUser(currentUser);
    
    // Fetch videos only once user is set
    fetchTeacherVideos(currentUser.id);
    
    // Fetch teacher profile data
    fetchTeacherProfile(currentUser.id);
  }, [navigate]);

  const fetchTeacherVideos = async (teacherId, token) => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5001/api/videos/my-videos`, {
        headers: {
          'UserId': teacherId
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Process videos to ensure thumbnail URLs are correctly formatted
        const processedVideos = (data.videos || []).map(video => ({
          ...video,
          thumbnailUrl: video.thumbnailUrl || "/placeholder.svg",
          // If thumbnailUrl is relative, make it absolute
          ...(video.thumbnailUrl && !video.thumbnailUrl.startsWith('http') && !video.thumbnailUrl.startsWith('/') 
              ? { thumbnailUrl: `http://localhost:5001/uploads/${video.thumbnailUrl}` } 
              : {})
        }));
        setVideos(processedVideos);
      } else {
        console.error('Failed to fetch videos');
        // If API call fails, use mock data for development
        const mockVideos = [
          {
            _id: 1,
            title: "Basic ASL Signs",
            description: "Learn the fundamental signs in American Sign Language",
            fileUrl: "/placeholder.svg",
            thumbnailUrl: "/placeholder.svg",
            views: 1200,
            createdAt: "2024-03-15"
          },
          {
            _id: 2,
            title: "ASL Numbers 1-10",
            description: "Master counting from 1 to 10 in ASL",
            fileUrl: "/placeholder.svg",
            thumbnailUrl: "/placeholder.svg",
            views: 800,
            createdAt: "2024-03-14"
          }
        ];
        setVideos(mockVideos);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
      // Use mock data if there's an error
      const mockVideos = [
        {
          _id: 1,
          title: "Basic ASL Signs",
          description: "Learn the fundamental signs in American Sign Language",
          fileUrl: "/placeholder.svg",
          thumbnailUrl: "/placeholder.svg",
          views: 1200,
          createdAt: "2024-03-15"
        },
        {
          _id: 2,
          title: "ASL Numbers 1-10",
          description: "Master counting from 1 to 10 in ASL",
          fileUrl: "/placeholder.svg",
          thumbnailUrl: "/placeholder.svg",
          views: 800,
          createdAt: "2024-03-14"
        }
      ];
      setVideos(mockVideos);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const toggleVideoOptions = (videoId) => {
    setShowVideoOptions(showVideoOptions === videoId ? null : videoId);
  };

  const deleteVideo = async (videoId) => {
    try {
      if (!user || !user.id) {
        setErrorMessage('You must be logged in to delete videos');
        return;
      }
      
      const response = await fetch(`http://localhost:5001/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'UserId': user.id
        }
      });
      
      if (response.ok) {
        setVideos(prev => prev.filter(video => video._id !== videoId));
        setSuccessMessage('Video deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Failed to delete video');
        
        // Clear error message after 3 seconds
        setTimeout(() => {
          setErrorMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      setErrorMessage('Error deleting video');
      
      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
    
    setShowVideoOptions(null);
  };
  
  const handleViewVideo = (videoId) => {
    navigate(`/video/${videoId}`);
  };
  
  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const fetchTeacherProfile = async (userId) => {
    try {
      setIsLoading(true);
      console.log("Fetching teacher profile for user ID:", userId);
      
      // Make API call to get teacher profile
      const response = await fetch(`http://localhost:5001/api/profiles/teacher/${userId}`, {
        headers: {
          'UserId': userId
        }
      });
      
      console.log("Profile fetch response:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Profile data received:", data);
        
        // Update localStorage user data with profile information
        const currentUser = JSON.parse(localStorage.getItem("user"));
        const updatedUser = { 
          ...currentUser,
          username: data.profile.fullName || currentUser.username,
          email: data.profile.email || currentUser.email,
          bio: data.profile.bio || "",
          location: data.profile.location || "",
          contact: data.profile.contact || "",
          profileImageUrl: data.profile.profileImageUrl || ""
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      } else {
        console.log("Profile not found or error");
      }
    } catch (error) {
      console.error("Failed to fetch teacher profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      console.log("Submitting profile update for user ID:", user.id);
      console.log("Profile data being sent:", profileForm);
      
      // Make API call to update teacher profile
      const response = await fetch(`http://localhost:5001/api/profiles/teacher/${user.id}`, {
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

  const handleEditVideo = (video) => {
    setVideoToEdit(video);
    setActiveTab('upload');
  };

  const handleVideoUploadSuccess = (uploadedVideo) => {
    // Add the new video to the videos list or update if editing
    if (videoToEdit) {
      setVideos(prevVideos => prevVideos.map(video => 
        video._id === uploadedVideo._id ? uploadedVideo : video
      ));
      setVideoToEdit(null);
    } else {
      setVideos(prevVideos => [uploadedVideo, ...prevVideos]);
    }
    
    // Set success message
    setSuccessMessage('Video uploaded successfully!');
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
    // Switch to the videos tab
    setActiveTab('dashboard');
  };

  const getColorForCategory = (category) => {
    switch (category) {
      case 'Beginner':
        return '#4f46e5';
      case 'Intermediate':
        return '#fbbf24';
      case 'Advanced':
        return '#ef4444';
      default:
        return '#f3f4f6';
    }
  };
  
  // Helper function to estimate video duration based on file size
  const calculateDuration = (fileSize) => {
    if (!fileSize) return "00:00";
    // Rough estimation: 1MB ≈ 10 seconds of video at medium quality
    const seconds = Math.floor((fileSize / 1024 / 1024) * 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            onClick={() => setActiveTab("dashboard")}
            className={`sidebar-button ${activeTab === "dashboard" ? "active" : ""}`}
          >
            <FaHome className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveTab("upload")}
            className={`sidebar-button ${activeTab === "upload" ? "active" : ""}`}
          >
            <FaUpload className="sidebar-button-icon" />
            {sidebarOpen && <span className="sidebar-button-text">Upload Video</span>}
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
              {activeTab === "dashboard" && "Teacher Dashboard"}
              {activeTab === "upload" && "Upload New Video"}
              {activeTab === "profile" && "Profile Settings"}
            </h1>
            </div>
            
            {user && (
              <div className="user-profile">
                <div className="user-info hidden sm:block">
                  <p className="user-name">{user.username || "Teacher"}</p>
                  <p className="user-email">{user.email || "teacher@example.com"}</p>
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
                    user.username ? user.username.charAt(0).toUpperCase() : "T"
                  )}
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="dashboard-content">
            {activeTab === "dashboard" && (
            <div>
                {/* Statistics Cards */}
              <div className="stats-grid">
                  <div className="stats-card">
                    <div className="flex items-center justify-between">
                      <div>
                      <p className="stats-card-title">Total Videos</p>
                      <h3 className="stats-card-value">{videos.length}</h3>
                      </div>
                    <div className="stats-card-icon">
                      <FaPlay />
                    </div>
                    </div>
                  </div>
                  
                  <div className="stats-card">
                    <div className="flex items-center justify-between">
                      <div>
                      <p className="stats-card-title">Total Views</p>
                      <h3 className="stats-card-value">
                        {videos.reduce((total, video) => total + (video.views || 0), 0)}
                      </h3>
                      </div>
                    <div className="stats-card-icon">
                      <FaEye />
                    </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent Videos */}
              <div className="dashboard-card">
                <div className="flex justify-between items-center" style={{marginBottom: "1.5rem"}}>
                  <h2 style={{fontSize: "1.25rem", fontWeight: "700", color: "#1f2937"}}>Recent Videos</h2>
                    <button 
                      className="dashboard-button dashboard-button-secondary"
                      onClick={() => setActiveTab("upload")}
                    >
                      Upload New
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="dashboard-table">
                      <thead>
                        <tr>
                          <th>Video</th>
                          <th className="hidden md:table-cell">Category</th>
                          <th className="hidden md:table-cell">Upload Date</th>
                          <th className="hidden md:table-cell">Views</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {videos.map((video) => (
                          <tr key={video._id}>
                            <td>
                              <div className="flex items-center gap-4">
                                <div 
                                  className="video-thumbnail-container"
                                  onClick={() => handleViewVideo(video._id)}
                                  style={{ cursor: "pointer" }}
                                >
                                  <img
                                    src={video.thumbnailUrl || "/placeholder.svg"}
                                    alt={video.title || "Video"}
                                    className="video-thumbnail-image"
                                    onError={(e) => {
                                      console.log(`Failed to load thumbnail for video: ${video._id}`);
                                      e.target.onerror = null;
                                      e.target.src = "/placeholder.svg";
                                    }}
                                  />
                                  {video.category && (
                                    <div className="video-thumbnail-badge" 
                                         style={{
                                           backgroundColor: getColorForCategory(video.category) + 'DD',
                                           color: 'white'
                                         }}>
                                      {video.category}
                                    </div>
                                  )}
                                  <div className="video-thumbnail-overlay">
                                    <span className="video-duration">
                                      {video.duration || calculateDuration(video.fileSize) || "00:00"}
                                    </span>
                                  </div>
                                </div>
                                <span className="font-medium text-gray-800 line-clamp-1">{video.title}</span>
                              </div>
                            </td>
                            <td className="hidden md:table-cell">
                              {video.category ? (
                                <span className="px-2 py-1 rounded-full text-xs" style={{
                                  backgroundColor: getColorForCategory(video.category) + '20', // Add transparency
                                  color: getColorForCategory(video.category),
                                  border: `1px solid ${getColorForCategory(video.category)}`,
                                  fontWeight: 500
                                }}>
                                  {video.category}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">No category</span>
                              )}
                            </td>
                            <td className="hidden md:table-cell">
                              {new Date(video.createdAt).toLocaleDateString()}
                            </td>
                            <td className="hidden md:table-cell">
                              <div className="flex items-center">
                                <FaEye className="text-gray-400 mr-1" size={14} />
                                <span>{video.views || 0}</span>
                              </div>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button 
                                  className="dashboard-button-icon"
                                  onClick={() => handleEditVideo(video)}
                                >
                                  <FaEdit className="text-gray-500" />
                                </button>
                                <button 
                                  className="dashboard-button-icon"
                                  onClick={() => deleteVideo(video._id)}
                                >
                                  <FaTrash className="text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "upload" && (
            <div className="dashboard-card">
                <TeacherVideoUpload 
                  onUploadSuccess={handleVideoUploadSuccess} 
                  videoToEdit={videoToEdit}
                />
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
                      console.log("Updating teacher profile from UserProfile component", profileData);
                      
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
                      
                      const response = await fetch(`http://localhost:5001/api/profiles/teacher/${user.id}`, {
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
                      
                      // Update local user data with profile info
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

export default TeacherDashboard;
