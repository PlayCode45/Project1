import React, { useState, useEffect, useRef } from 'react';
import { FaUpload, FaSpinner, FaTimesCircle, FaCheckCircle } from 'react-icons/fa';
import '../../styles/VideoUpload.css';

const TeacherVideoUpload = ({ onUploadSuccess, videoToEdit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Beginner'
  });
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Handle preloading data when editing
  useEffect(() => {
    if (videoToEdit) {
      setFormData({
        title: videoToEdit.title || '',
        description: videoToEdit.description || '',
        category: videoToEdit.category || 'Beginner'
      });
      
      if (videoToEdit.thumbnailUrl) {
        setThumbnailPreview(videoToEdit.thumbnailUrl);
      }
      
      setIsEditing(true);
    } else {
      // Reset form when not editing
      setFormData({
        title: '',
        description: '',
        category: 'Beginner'
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setIsEditing(false);
      
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  }, [videoToEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate video file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }
    
    // Validate file size
    if (file.size <= 0) {
      setError('The selected video file appears to be empty. Please select a valid video file.');
      return;
    }
    
    // Set maximum file size (100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setError(`Video file size exceeds the maximum limit of 100MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }
    
    console.log('Video file selected:', file.name);
    setVideoFile(file);
    setError('');
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate image file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file for the thumbnail');
      return;
    }
    
    // Validate file size
    if (file.size <= 0) {
      setError('The selected thumbnail file appears to be empty. Please select a valid image file.');
      return;
    }
    
    // Set maximum thumbnail size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError(`Thumbnail file size exceeds the maximum limit of 5MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
      return;
    }
    
    console.log('Thumbnail file selected:', file.name);
    setThumbnailFile(file);
    
    // Create thumbnail preview
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnailPreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form
    if (!formData.title.trim()) {
      setError('Please enter a title for the video');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Please enter a description for the video');
      return;
    }
    
    // Validate category
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(formData.category)) {
      setError('Please select a valid category');
      return;
    }
    
    // When editing, don't require video file if none selected
    if (!isEditing && !videoFile) {
      setError('Please select a video to upload');
      return;
    }
    
    // Check if video file is valid
    if (videoFile && videoFile.size <= 0) {
      setError('The video file appears to be empty. Please select a valid video file.');
      return;
    }
    
    // Check if thumbnail file is valid
    if (thumbnailFile && thumbnailFile.size <= 0) {
      setError('The thumbnail file appears to be empty. Please select a valid image file.');
      return;
    }
    
    if (!user || !user.id) {
      setError('You must be logged in to upload videos');
      return;
    }
    
    setLoading(true);
    setProgress(0);
    
    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      
      // Only add video file if it's a new upload or we're replacing the video
      if (videoFile) {
        // Double-check file size before upload
        if (videoFile.size <= 0) {
          throw new Error('The video file appears to be empty. Please select a valid video file.');
        }
        formDataToSend.append('video', videoFile);
      }
      
      // Only add thumbnail if we have a new one
      if (thumbnailFile) {
        // Double-check file size before upload
        if (thumbnailFile.size <= 0) {
          throw new Error('The thumbnail file appears to be empty. Please select a valid image file.');
        }
        formDataToSend.append('thumbnail', thumbnailFile);
      }
      
      // Add video ID if editing
      if (isEditing && videoToEdit._id) {
        formDataToSend.append('videoId', videoToEdit._id);
      }
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const nextProgress = prev + 5;
          return nextProgress > 90 ? 90 : nextProgress;
        });
      }, 500);
      
      // Select endpoint based on whether we're editing or creating
      const endpoint = isEditing 
        ? `http://localhost:5001/api/videos/${videoToEdit._id}` 
        : 'http://localhost:5001/api/videos/upload';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Make API request
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'UserId': user.id
          // Don't set Content-Type when using FormData
        },
        body: formDataToSend
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to upload video';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        // Check for category validation errors
        if (errorText.includes('category') && errorText.includes('enum')) {
          errorMessage = 'Invalid category selected. Please use Beginner, Intermediate, or Advanced.';
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log(isEditing ? 'Update successful:' : 'Upload successful:', data);
      
      // Set progress to 100% when complete
      setProgress(100);
      setSuccess(isEditing ? 'Video updated successfully!' : 'Video uploaded successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Beginner'
      });
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setIsEditing(false);
      
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess(data.video);
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload-container">
      <div className="video-upload-card">
        <h2 className="video-upload-title">{isEditing ? 'Edit Video' : 'Upload New Video'}</h2>
        
        {error && (
          <div className="upload-alert upload-alert-error">
            <FaTimesCircle className="alert-icon" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="upload-alert upload-alert-success">
            <FaCheckCircle className="alert-icon" />
            <span>{success}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="video-upload-form" encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="title">Video Title <span className="required">*</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter video title"
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter video description"
              disabled={loading}
              required
              rows="4"
            ></textarea>
          </div>
          
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="form-input"
              required
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="video">
              Video File {!isEditing && <span className="required">*</span>}
              {isEditing && <span className="optional">(leave empty to keep current video)</span>}
            </label>
            <div className="file-input-container">
              <input
                type="file"
                id="video"
                name="video"
                onChange={handleVideoChange}
                accept="video/*"
                disabled={loading}
                ref={videoInputRef}
                className="file-input"
                required={!isEditing}
              />
              <div className="file-input-button">
                <FaUpload className="upload-icon" />
                <span>{videoFile ? videoFile.name : isEditing ? 'Replace Video File' : 'Choose Video File'}</span>
              </div>
            </div>
            <small>Max file size: 100MB. Supported formats: MP4, MOV, AVI</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="thumbnail">
              Thumbnail Image 
              {isEditing && thumbnailPreview && <span className="optional">(leave empty to keep current thumbnail)</span>}
            </label>
            <div className="file-input-container">
              <input
                type="file"
                id="thumbnail"
                name="thumbnail"
                onChange={handleThumbnailChange}
                accept="image/*"
                disabled={loading}
                ref={thumbnailInputRef}
                className="file-input"
              />
              <div className="file-input-button">
                <FaUpload className="upload-icon" />
                <span>{thumbnailFile ? thumbnailFile.name : isEditing ? 'Replace Thumbnail' : 'Choose Thumbnail'}</span>
              </div>
            </div>
            
            {thumbnailPreview && (
              <div className="thumbnail-preview">
                <img src={thumbnailPreview} alt="Thumbnail preview" />
              </div>
            )}
          </div>
          
          {loading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{progress}% Uploaded</p>
            </div>
          )}
          
          <button 
            type="submit" 
            className="upload-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner" />
                <span>{isEditing ? 'Updating...' : 'Uploading...'}</span>
              </>
            ) : (
              <>
                <FaUpload />
                <span>{isEditing ? 'Update Video' : 'Upload Video'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherVideoUpload; 