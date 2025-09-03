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
                confirmButtonColor: '#3498db'
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
                confirmButtonColor: '#3498db'
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
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/recommendations/recommend`, {
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
                navigate('/login');
                
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
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="student-dashboard">
            <header className="dashboard-header">
                <h1>Student Dashboard</h1>
                <div className="user-info">
                    <span>Welcome, {user?.name}</span>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </header>

            <div className="dashboard-tabs">
                <button 
                    className={activeTab === 'available' ? 'active' : ''} 
                    onClick={() => setActiveTab('available')}
                >
                    Available Courses
                </button>
                <button 
                    className={activeTab === 'enrolled' ? 'active' : ''} 
                    onClick={() => setActiveTab('enrolled')}
                >
                    My Courses
                </button>
                <button 
                    className={activeTab === 'ai' ? 'active' : ''} 
                    onClick={() => setActiveTab('ai')}
                >
                    AI Recommendations
                </button>
            </div>

            <div className="dashboard-content">
                {activeTab === 'available' && (
                    <div className="courses-grid">
                        {courses.map(course => (
                            <div key={course._id} className="course-card">
                                <h3>{course.title}</h3>
                                <p className="course-description">{course.description}</p>
                                <div className="course-meta">
                                    <span className="course-category">{course.category}</span>
                                    <span className="course-level">{course.level}</span>
                                </div>
                                <p className="instructor">Instructor: {course.instructor?.name || 'Unknown'}</p>
                                <button 
                                    onClick={() => enrollInCourse(course._id)}
                                    className="enroll-btn"
                                    disabled={enrolledCourses.some(ec => ec.course?._id === course._id)}
                                >
                                    {enrolledCourses.some(ec => ec.course?._id === course._id) ? 'Enrolled' : 'Enroll'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'enrolled' && (
                    <div className="enrolled-courses">
                        {enrolledCourses.length === 0 ? (
                            <p>You haven't enrolled in any courses yet.</p>
                        ) : (
                            enrolledCourses.map(enrollment => (
                                <div key={enrollment._id} className="enrolled-course-card">
                                    <h3>{enrollment.course?.title}</h3>
                                    <p>{enrollment.course?.description}</p>
                                    <div className="progress-container">
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${enrollment.progress}%` }}
                                            ></div>
                                        </div>
                                        <span>{enrollment.progress}% Complete</span>
                                    </div>
                                    <p>Status: {enrollment.status}</p>
                                    <div className="course-actions">
                                        <button 
                                            onClick={() => goToCourse(enrollment.course?._id)}
                                            className="go-to-course-btn"
                                        >
                                            Go to Course
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="ai-recommendations">
                        <div className="ai-prompt-section">
                            <h3>Get Course Recommendations</h3>
                            <p>Tell us what you're interested in learning, and we'll recommend the best courses for you.</p>
                            <div className="prompt-input">
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g., I want to be a software engineer, what courses should I follow?"
                                />
                                <button onClick={getAiRecommendations}>Get Recommendations</button>
                            </div>
                        </div>

                        {aiRecommendations.length > 0 && (
                            <div className="recommendations-results">
                                <h4>Recommended Courses</h4>
                                <div className="recommendations-grid">
                                    {aiRecommendations.map(rec => (
                                        <div key={rec.courseId} className="recommendation-card">
                                            <h5>{rec.course.title}</h5>
                                            <p>{rec.course.description}</p>
                                            <p className="reason">{rec.reason}</p>
                                            <button 
                                                onClick={() => enrollInCourse(rec.courseId)}
                                                className="enroll-btn"
                                            >
                                                Enroll Now
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
    );
};

export default StudentDashboard;