// LandingPage.js (updated)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/LandingPage.css';
import Logo from './Logo';
import CourseSection from './CourseSection'; // Import the new component

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
                                <i className="fas fa-graduation-cap"></i>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Add the CourseSection component here */}
                <CourseSection />

                <section className="features-section">
                    {/* ... existing features section code ... */}
                </section>

                <section className="cta-section">
                    {/* ... existing CTA section code ... */}
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