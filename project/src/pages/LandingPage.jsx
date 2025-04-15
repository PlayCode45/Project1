import React, { useState, useRef, useEffect } from "react";
import "../App.css";
import { FaPlay, FaFileAlt, FaCheckCircle, FaComments } from "react-icons/fa";

function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const heroRef = useRef(null);
  const howItWorksRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);
  const ctaRef = useRef(null);

  const scrollToSection = (elementRef) => {
    window.scrollTo({
      top: elementRef.current.offsetTop,
      behavior: "smooth",
    });
    setIsMenuOpen(false);
  };

  return (
    <div className="app">
      {/* Header/Navigation */}
      <header className="header">
        <div className="container">
          <div className="logo">
            <span className="logo-icon">📚</span> EduSkill
          </div>

          <div
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          <nav className={`nav ${isMenuOpen ? "open" : ""}`}>
            <ul>
              <li>
                <button onClick={() => scrollToSection(featuresRef)}>
                  Features
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(howItWorksRef)}>
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection(testimonialsRef)}>
                  Testimonials
                </button>
              </li>
              <li>
                <a href="/signin" className="login-button">
                  Login
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" ref={heroRef}>
        <div className="container">
          <div className="hero-content">
            <h1>
              Learn New Skills
              <br />
              Anywhere, Anytime
            </h1>
            <p>
              Expand your knowledge and master new skills with our interactive online 
              learning platform. Start your educational journey today.
            </p>
            <div className="hero-buttons">
              <button
                className="btn primary"
                onClick={() => scrollToSection(ctaRef)}
              >
                Start Learning
              </button>
              <button
                className="btn secondary"
                onClick={() => (window.location.href = "/signup")}
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="hero-video">
            <div className="video-placeholder">
              <div className="play-button">
                <FaPlay />
              </div>
            </div>
          </div>
        </div>
        <div className="wave-divider"></div>
      </section>

      {/* Features Section */}
      <section className="features" ref={featuresRef}>
        <div className="container">
          <h2>Why Learn With EduSkill?</h2>
          <p className="section-subtitle">
            Our platform makes learning new skills accessible, engaging, and
            effective
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaFileAlt />
              </div>
              <h3>Comprehensive Curriculum</h3>
              <p>
                From beginner fundamentals to advanced concepts, our
                structured courses cover a wide range of subjects and skills.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaCheckCircle />
              </div>
              <h3>Expert Instructors</h3>
              <p>
                Learn from industry professionals and experienced educators who provide 
                practical, real-world instruction in their fields of expertise.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaComments />
              </div>
              <h3>Interactive Learning</h3>
              <p>
                Practice what you learn with interactive exercises and get
                personalized feedback to improve your skills faster.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" ref={howItWorksRef}>
        <div className="container">
          <h2>How EduSkill Works</h2>
          <p className="section-subtitle">
            Our simple process gets you learning new skills in minutes
          </p>

          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create an Account</h3>
              <p>
                Sign up as a learner to access our extensive library of courses and lessons.
              </p>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <h3>Browse Courses</h3>
              <p>
                Explore our diverse collection of courses organized by subject and skill level.
              </p>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <h3>Start Learning</h3>
              <p>
                Watch videos, complete exercises, and track your progress as you
                master new skills and advance your knowledge.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials" ref={testimonialsRef}>
        <div className="container">
          <h2>What Our Users Say</h2>
          <p className="section-subtitle">
            Join thousands who have successfully learned new skills with
            EduSkill
          </p>

          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">M</div>
                <div className="user-info">
                  <h4>Michael Johnson</h4>
                  <p>Learner</p>
                </div>
              </div>
              <p className="testimonial-text">
                "EduSkill has transformed my career prospects. The courses are clear, 
                practical, and I can learn at my own pace from anywhere."
              </p>
              <div className="rating">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">S</div>
                <div className="user-info">
                  <h4>Sarah Williams</h4>
                  <p>Teacher</p>
                </div>
              </div>
              <p className="testimonial-text">
                "As an educator, I love how easy it is to share
                my knowledge with students worldwide. The platform is intuitive
                and engaging for both teachers and learners."
              </p>
              <div className="rating">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="avatar">D</div>
                <div className="user-info">
                  <h4>David Chen</h4>
                  <p>Professional</p>
                </div>
              </div>
              <p className="testimonial-text">
                "I've tried several online learning platforms, but EduSkill stands out
                for its comprehensive content, quality instruction, and supportive community."
              </p>
              <div className="rating">
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>★</span>
                <span>☆</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta" ref={ctaRef}>
        <div className="container">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>
            Join our community of learners and instructors today and unlock your
            full potential with new skills and knowledge.
          </p>
          <div className="cta-buttons">
            <button
              className="btn primary"
              onClick={() => (window.location.href = "/signin")}
            >
              Start Learning
            </button>
            <button
              className="btn secondary"
              onClick={() => (window.location.href = "/signup")}
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-columns">
            <div className="footer-column">
              <div className="footer-logo">
                <span className="logo-icon">📚</span> EduSkill
              </div>
              <p>
                Making quality education accessible to everyone, everywhere.
              </p>
            </div>

            <div className="footer-column">
              <h3>Platform</h3>
              <ul>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(howItWorksRef);
                    }}
                  >
                    How it works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(featuresRef);
                    }}
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(testimonialsRef);
                    }}
                  >
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#">Pricing</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h3>Resources</h3>
              <ul>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Community</a>
                </li>
                <li>
                  <a href="#">Support</a>
                </li>
                <li>
                  <a href="#">FAQ</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} EduSkill. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
