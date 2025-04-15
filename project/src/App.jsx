import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from './pages/TeacherDashboard';
import LearnerDashboard from './pages/LearnerDashboard';
import VideoPlayer from './pages/VideoPlayer';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import './styles/App.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/learner/dashboard" element={<LearnerDashboard />} />
        <Route path="/video/:videoId" element={<VideoPlayer />} />
        {/* Fallback route for landing page */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
