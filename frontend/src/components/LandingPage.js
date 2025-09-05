import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/LandingPage.css';
import Logo from './Logo';
// import image from '../assets/coursehub-logo.png';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleStudentSignup = () => {
        navigate('/register', { state: { role: 'student' } });
    };

    const handleInstructorSignup = () => {
        navigate('/register', { state: { role: 'instructor' } });
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <div className="landing-page">
            <header className="landing-header">
                <div className="container">
                    {/* <logo>
                        <img src={image} width={50} height={50} alt="CourseHub Logo" />
                    </logo> */}
                    <h1 className="logo">CourseHub-GPT</h1>
                    <nav className="nav-menu">
                        <button onClick={handleLogin} className="login-btn">Login</button>
                    </nav>
                </div>
            </header>

            <main className="landing-main">
                <section className="hero-section">
                    <div className="container">
                        <div className="hero-content">
                            <h1>Transform Your Learning Journey</h1>
                            <p>Join thousands of students and instructors in our interactive learning platform. Access courses, track progress, and achieve your educational goals.</p>
                            <div className="hero-buttons">
                                <button onClick={handleStudentSignup} className="btn btn-primary">
                                    Be a Student
                                </button>
                                <button onClick={handleInstructorSignup} className="btn btn-secondary">
                                    Be an Instructor
                                </button>
                            </div>
                        </div>
                        <div className="hero-image">
                            <div className="placeholder-image">
                                {/* <Logo /> */}
                                <i className="fas fa-graduation-cap"></i>
                                {/* <img src={image} alt="Learning Illustration" /> */}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="features-section">
                    <div className="container">
                        <h2>Why Choose CourseHub-GPT?</h2>
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-book"></i>
                                </div>
                                <h3>Comprehensive Courses</h3>
                                <p>Access a wide range of courses across various subjects and skill levels.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-chalkboard-teacher"></i>
                                </div>
                                <h3>Expert Instructors</h3>
                                <p>Learn from industry professionals and experienced educators.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-robot"></i>
                                </div>
                                <h3>AI Recommendations</h3>
                                <p>Get personalized course suggestions based on your interests and goals.</p>
                            </div>
                            <div className="feature-card">
                                <div className="feature-icon">
                                    <i className="fas fa-chart-line"></i>
                                </div>
                                <h3>Progress Tracking</h3>
                                <p>Monitor your learning progress with detailed analytics and reports.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="cta-section">
                    <div className="container">
                        <Logo />
                        <h2>Ready to Start Your Learning Journey?</h2>
                        <p>Join our community of learners and instructors today.</p>
                        <div className="cta-buttons">
                            <button onClick={handleStudentSignup} className="btn btn-primary">
                                Join as Student
                            </button>
                            <button onClick={handleInstructorSignup} className="btn btn-secondary">
                                Join as Instructor
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="container">
                    <p>&copy; 2025 CourseHub-GPT. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;