import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaEnvelope, FaMapMarkerAlt, FaPhone, FaInfoCircle, FaCamera, FaUpload } from 'react-icons/fa';
import '../styles/UserProfile.css';

const UserProfile = ({ user, onProfileUpdate }) => {
  const [profileForm, setProfileForm] = useState({
    username: '',
    email: '',
    location: '',
    contact: '',
    bio: '',
    profileImage: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      // Initialize form with user data from localStorage
      setProfileForm({
        username: user.username || '',
        email: user.email || '',
        location: user.location || '',
        contact: user.contact || '',
        bio: user.bio || '',
        profileImage: null
      });
      
      // Set image preview if user has an existing profile image
      if (user.profileImageUrl) {
        setImagePreview(user.profileImageUrl);
      }
    }
  }, [user]); // Re-initialize whenever user prop changes

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Image size should be less than 5MB');
        return;
      }
      
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validImageTypes.includes(file.type)) {
        setErrorMessage('Please upload a valid image file (JPEG, PNG, or GIF)');
        return;
      }
      
      // Set file to form data
      setProfileForm(prev => ({
        ...prev,
        profileImage: file
      }));
      
      // Create and set image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any error message
      setErrorMessage('');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log("Submitting profile update for user:", user);
      console.log("Profile data being sent:", profileForm);
      
      // Create FormData object to handle file upload
      const formData = new FormData();
      formData.append('username', profileForm.username);
      formData.append('email', profileForm.email);
      formData.append('location', profileForm.location);
      formData.append('contact', profileForm.contact);
      formData.append('bio', profileForm.bio);
      
      // Only append image if a new one was selected
      if (profileForm.profileImage) {
        formData.append('profileImage', profileForm.profileImage);
      }
      
      // Call the provided update function with FormData
      await onProfileUpdate(formData);
      
      // Show success message
      setSuccessMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error("Profile update error:", error);
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-card landscape">
      <h2 className="profile-title">Your Profile</h2>
      
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="profile-layout">
        <div className="profile-image-section">
          <div className="profile-image-container">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile Preview" 
                className="profile-image"
              />
            ) : (
              <div className="profile-image-placeholder">
                <FaUser size={50} />
              </div>
            )}
            <div className="profile-image-overlay" onClick={triggerFileInput}>
              <FaCamera size={20} />
              <span>Change Photo</span>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <button 
            type="button" 
            className="upload-button"
            onClick={triggerFileInput}
          >
            <FaUpload className="icon" /> Upload Image
          </button>
          <div className="image-requirements">
            <p>Maximum file size: 5MB</p>
            <p>Supported formats: JPEG, PNG, GIF</p>
          </div>
        </div>
        
        <div className="profile-form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="username">
                <FaUser className="icon" />
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={profileForm.username}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope className="icon" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileForm.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="location">
                <FaMapMarkerAlt className="icon" />
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={profileForm.location}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="contact">
                <FaPhone className="icon" />
                Contact
              </label>
              <input
                type="text"
                id="contact"
                name="contact"
                value={profileForm.contact}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">
                <FaInfoCircle className="icon" />
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={profileForm.bio}
                onChange={handleChange}
                className="form-textarea"
                rows="3"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 