import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";
import "../styles/SignUp.css";

function SignUp() {
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Learner",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    try {
      const { confirmPassword, ...userData } = user;
      
      const response = await fetch("http://localhost:5001/api/users/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/signin");
      } else {
        setError(data.message || "Signup failed!");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Something went wrong!");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form">
        <h2 className="signup-title">Create an Account</h2>

        {error && <div className="signup-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="signup-input-group">
            <label htmlFor="username">Username</label>
            <FaUser className="signup-input-icon" />
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              value={user.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-input-group">
            <label htmlFor="email">Email</label>
            <FaEnvelope className="signup-input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={user.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-input-group">
            <label htmlFor="password">Password</label>
            <FaLock className="signup-input-icon" />
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={user.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <FaLock className="signup-input-icon" />
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={user.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="signup-radio-group">
            <label>Select Role</label>
            <div className="signup-radio-options">
              <div className="signup-radio-option">
                <input
                  type="radio"
                  id="learner"
                  name="role"
                  value="Learner"
                  checked={user.role === "Learner"}
                  onChange={handleChange}
                />
                <label htmlFor="learner">Learner</label>
              </div>
              <div className="signup-radio-option">
                <input
                  type="radio"
                  id="teacher"
                  name="role"
                  value="Teacher"
                  checked={user.role === "Teacher"}
                  onChange={handleChange}
                />
                <label htmlFor="teacher">Teacher</label>
              </div>
            </div>
          </div>

          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>

        <div className="signup-footer">
          <p>
            Already have an account?{" "}
            <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
