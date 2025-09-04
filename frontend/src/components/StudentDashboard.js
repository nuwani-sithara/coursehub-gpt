import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import StudentNavbar from './StudentNavbar';
import AvailableCourses from './AvailableCourses';
import MyCourses from './MyCourses';
import AIRecommendations from './AIRecommendations';
import '../stylesheets/StudentDashboard.css';
import Footer from './Footer';

const StudentDashboard = () => {
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
            return Promise.reject('Prompt required');
        }

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/ai-recommendations/recommend`, {
                prompt: aiPrompt,
                maxCourses: 5
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setAiRecommendations(response.data.recommendations || []);
            
            if (response.data.recommendations.length === 0) {
                await Swal.fire({
                    icon: 'info',
                    title: 'No Recommendations',
                    text: 'No courses found matching your criteria. Try a different prompt.',
                    confirmButtonColor: '#3498db'
                });
            }
            
            return response.data; // Return the response data
        } catch (error) {
            console.error('Error getting AI recommendations:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Recommendation Failed',
                text: `Error getting recommendations: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
            
            throw error; // Re-throw the error
        }
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
            <StudentNavbar user={user} />
            
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
                            <AvailableCourses 
                                courses={courses} 
                                enrolledCourses={enrolledCourses} 
                                enrollInCourse={enrollInCourse} 
                            />
                        )}

                        {activeTab === 'enrolled' && (
                            <MyCourses 
                                enrolledCourses={enrolledCourses} 
                                setActiveTab={setActiveTab} 
                            />
                        )}

                        {activeTab === 'ai' && (
                            <AIRecommendations 
                                aiPrompt={aiPrompt}
                                setAiPrompt={setAiPrompt}
                                aiRecommendations={aiRecommendations}
                                getAiRecommendations={getAiRecommendations}
                                enrollInCourse={enrollInCourse}
                            />
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default StudentDashboard;