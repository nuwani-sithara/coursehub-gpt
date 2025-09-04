import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/StudentDashboard.css';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('available');
    const [courses, setCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiRecommendations, setAiRecommendations] = useState([]);

    useEffect(() => {
        fetchUserData();
        fetchCourses();
        fetchEnrolledCourses();
    }, []);

    const fetchUserData = () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
    };

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses/all-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch courses. Please try again later.',
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchEnrolledCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/enrollments/my-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrolledCourses(response.data);
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch your enrolled courses. Please try again later.',
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const enrollInCourse = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/enrollments/enroll-course/${courseId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Enrolled in course successfully!',
                confirmButtonColor: '#27ae60',
                timer: 2000
            });
            
            fetchEnrolledCourses();
        } catch (error) {
            console.error('Error enrolling in course:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Enrollment Failed',
                text: `Error enrolling in course: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const getAiRecommendations = async () => {
        if (!aiPrompt.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Prompt Required',
                text: 'Please enter a prompt to get recommendations.',
                confirmButtonColor: '#f39c12'
            });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai-recommendations/recommend`, {
                prompt: aiPrompt,
                maxCourses: 5
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setAiRecommendations(response.data.recommendations);
            
            if (response.data.recommendations.length === 0) {
                await Swal.fire({
                    icon: 'info',
                    title: 'No Recommendations',
                    text: 'No courses found matching your criteria. Try a different prompt.',
                    confirmButtonColor: '#3498db'
                });
            }
        } catch (error) {
            console.error('Error getting AI recommendations:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Recommendation Failed',
                text: `Error getting recommendations: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const goToCourse = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    const logout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will be logged out of your account.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3498db',
            cancelButtonColor: '#e74c3c',
            confirmButtonText: 'Yes, logout!'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/');
                
                Swal.fire({
                    icon: 'success',
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out.',
                    confirmButtonColor: '#27ae60',
                    timer: 1500
                });
            }
        });
    };

    if (loading) {
        return (
            <div className="student-dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading your dashboard...</p>
            </div>
        );
    }

    return (
        <div className="student-dashboard">
            <header className="student-header">
                <div className="container">
                    <h1 className="student-logo">CourseHub-GPT Student</h1>
                    <div className="student-user-info">
                        <span>Welcome, {user?.name}</span>
                        <button onClick={logout} className="student-logout-btn">
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="student-main">
                <div className="container">
                    <div className="student-hero">
                        <h2>Your Learning Journey</h2>
                        <p>Discover new courses, track your progress, and achieve your learning goals</p>
                    </div>

                    <div className="dashboard-tabs">
                        <button 
                            className={activeTab === 'available' ? 'active' : ''} 
                            onClick={() => setActiveTab('available')}
                        >
                            <i className="fas fa-book"></i> Available Courses
                        </button>
                        <button 
                            className={activeTab === 'enrolled' ? 'active' : ''} 
                            onClick={() => setActiveTab('enrolled')}
                        >
                            <i className="fas fa-user-graduate"></i> My Courses
                        </button>
                        <button 
                            className={activeTab === 'ai' ? 'active' : ''} 
                            onClick={() => setActiveTab('ai')}
                        >
                            <i className="fas fa-robot"></i> AI Recommendations
                        </button>
                    </div>

                    <div className="dashboard-content">
                        {activeTab === 'available' && (
                            <div className="courses-section">
                                <h3>Available Courses</h3>
                                {courses.length === 0 ? (
                                    <div className="no-courses">
                                        <i className="fas fa-book-open"></i>
                                        <h4>No Courses Available</h4>
                                        <p>There are currently no courses available. Please check back later.</p>
                                    </div>
                                ) : (
                                    <div className="courses-grid">
                                        {courses.map(course => (
                                            <div key={course._id} className="course-card">
                                                <div className="course-card-header">
                                                    <h4>{course.title}</h4>
                                                    <div className="course-meta">
                                                        <span className={`course-badge course-level-${course.level?.toLowerCase() || 'beginner'}`}>
                                                            {course.level || 'Beginner'}
                                                        </span>
                                                        <span className="course-badge course-category">
                                                            {course.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <p className="course-description">{course.description}</p>
                                                
                                                <div className="course-instructor">
                                                    <i className="fas fa-chalkboard-teacher"></i>
                                                    Instructor: {course.instructor?.name || 'Unknown'}
                                                </div>
                                                
                                                <button 
                                                    onClick={() => enrollInCourse(course._id)}
                                                    className="enroll-btn"
                                                    disabled={enrolledCourses.some(ec => ec.course?._id === course._id)}
                                                >
                                                    {enrolledCourses.some(ec => ec.course?._id === course._id) ? (
                                                        <>
                                                            <i className="fas fa-check"></i> Enrolled
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="fas fa-plus"></i> Enroll
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'enrolled' && (
                            <div className="enrolled-courses-section">
                                <h3>My Enrolled Courses</h3>
                                {enrolledCourses.length === 0 ? (
                                    <div className="no-enrolled-courses">
                                        <i className="fas fa-graduation-cap"></i>
                                        <h4>No Enrolled Courses</h4>
                                        <p>You haven't enrolled in any courses yet. Browse available courses to get started!</p>
                                        <button 
                                            onClick={() => setActiveTab('available')}
                                            className="browse-courses-btn"
                                        >
                                            <i className="fas fa-book"></i> Browse Courses
                                        </button>
                                    </div>
                                ) : (
                                    <div className="enrolled-courses-grid">
                                        {enrolledCourses.map(enrollment => (
                                            <div key={enrollment._id} className="enrolled-course-card">
                                                <div className="enrolled-course-header">
                                                    <h4>{enrollment.course?.title}</h4>
                                                    <span className={`status-badge status-${enrollment.status}`}>
                                                        {enrollment.status}
                                                    </span>
                                                </div>
                                                
                                                <p className="course-description">{enrollment.course?.description}</p>
                                                
                                                <div className="progress-section">
                                                    <div className="progress-info">
                                                        <span>Progress: {enrollment.progress}%</span>
                                                        <span>Last accessed: {new Date(enrollment.lastAccessed).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="progress-container">
                                                        <div className="progress-bar">
                                                            <div 
                                                                className="progress-fill" 
                                                                style={{ width: `${enrollment.progress}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="course-actions">
                                                    <button 
                                                        onClick={() => goToCourse(enrollment.course?._id)}
                                                        className="go-to-course-btn"
                                                    >
                                                        <i className="fas fa-play-circle"></i> Continue Learning
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'ai' && (
                            <div className="ai-recommendations-section">
                                <div className="ai-hero">
                                    <h3>AI Course Recommendations</h3>
                                    <p>Tell us what you want to learn, and our AI will recommend the perfect courses for you</p>
                                </div>
                                
                                <div className="ai-prompt-section">
                                    <div className="prompt-input-container">
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            placeholder="e.g., I want to be a software engineer, what courses should I follow?"
                                            className="prompt-input"
                                        />
                                        <button 
                                            onClick={getAiRecommendations}
                                            className="get-recommendations-btn"
                                        >
                                            <i className="fas fa-robot"></i> Get Recommendations
                                        </button>
                                    </div>
                                </div>

                                {aiRecommendations.length > 0 && (
                                    <div className="recommendations-results">
                                        <h4>Recommended Courses</h4>
                                        <div className="recommendations-grid">
                                            {aiRecommendations.map(rec => (
                                                <div key={rec.courseId} className="recommendation-card">
                                                    <div className="recommendation-header">
                                                        <h5>{rec.course.title}</h5>
                                                        <p className="reason">{rec.reason}</p>
                                                    </div>
                                                    <p className="course-description">{rec.course.description}</p>
                                                    <button 
                                                        onClick={() => enrollInCourse(rec.courseId)}
                                                        className="enroll-btn"
                                                    >
                                                        <i className="fas fa-plus"></i> Enroll Now
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StudentDashboard;