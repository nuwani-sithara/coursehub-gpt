import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/CourseDetail.css';

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('enrolled');

    const fetchCourseDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCourse(response.data);
        } catch (error) {
            console.error('Error fetching course details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch course details. Please try again later.',
                confirmButtonColor: '#e74c3c'
            });
        }
    }, [courseId]);

    const fetchEnrollmentDetails = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/enrollments/my-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const userEnrollment = response.data.find(
                enrollment => enrollment.course?._id === courseId
            );
            
            if (userEnrollment) {
                setProgress(userEnrollment.progress);
                setStatus(userEnrollment.status);
            }
        } catch (error) {
            console.error('Error fetching enrollment details:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch enrollment details. Please try again later.',
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchCourseDetails();
        fetchEnrollmentDetails();
    }, [fetchCourseDetails, fetchEnrollmentDetails]);

    const updateProgress = async (newProgress) => {
        try {
            const token = localStorage.getItem('token');
            
            // Find the enrollment ID for this course
            const enrollmentsResponse = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/enrollments/my-courses`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const userEnrollment = enrollmentsResponse.data.find(
                enrollment => enrollment.course?._id === courseId
            );
            
            if (!userEnrollment) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'You are not enrolled in this course.',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            // Update the enrollment
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/enrollments/update-enrollment/${userEnrollment._id}`,
                { 
                    progress: newProgress,
                    status: newProgress === 100 ? 'completed' : 'in-progress'
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setProgress(newProgress);
            if (newProgress === 100) {
                setStatus('completed');
            }
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Progress updated successfully!',
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
        } catch (error) {
            console.error('Error updating progress:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: `Error updating progress: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const updateStatus = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            
            // Find the enrollment ID for this course
            const enrollmentsResponse = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/enrollments/my-courses`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const userEnrollment = enrollmentsResponse.data.find(
                enrollment => enrollment.course?._id === courseId
            );
            
            if (!userEnrollment) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'You are not enrolled in this course.',
                    confirmButtonColor: '#e74c3c'
                });
                return;
            }
            
            // Update the enrollment
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/enrollments/update-enrollment/${userEnrollment._id}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            setStatus(newStatus);
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Status updated successfully!',
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
        } catch (error) {
            console.error('Error updating status:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: `Error updating status: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const goBack = () => {
        navigate('/student-dashboard');
    };

    if (loading) {
        return (
            <div className="course-detail-loading">
                <div className="loading-spinner"></div>
                <p>Loading course details...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="course-detail-error">
                <i className="fas fa-exclamation-triangle"></i>
                <h2>Course Not Found</h2>
                <p>The course you're looking for doesn't exist or you don't have access to it.</p>
                <button onClick={goBack} className="back-to-dashboard-btn">
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="course-detail">
            <header className="course-header">
                <div className="container">
                    <button onClick={goBack} className="back-btn">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                    <h1>{course.title}</h1>
                </div>
            </header>

            <main className="course-main">
                <div className="container">
                    <div className="course-content">
                        <div className="course-sidebar">
                            <div className="course-info-card">
                                <div className="course-meta">
                                    <span className={`course-badge course-level-${course.level?.toLowerCase() || 'beginner'}`}>
                                        {course.level || 'Beginner'}
                                    </span>
                                    <span className="course-badge course-category">
                                        {course.category}
                                    </span>
                                    {course.duration && (
                                        <span className="course-badge course-duration">
                                            <i className="fas fa-clock"></i> {course.duration}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="instructor-info">
                                    <h3>
                                        <i className="fas fa-chalkboard-teacher"></i> Instructor
                                    </h3>
                                    <p>{course.instructor?.name || 'Unknown Instructor'}</p>
                                </div>

                                <div className="enrollment-status">
                                    <h3>
                                        <i className="fas fa-chart-line"></i> Your Progress
                                    </h3>
                                    <div className="progress-container">
                                        <div className="progress-info">
                                            <span>{progress}% Complete</span>
                                            <span className={`status-badge status-${status}`}>
                                                {status}
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="progress-controls">
                                    <h3>
                                        <i className="fas fa-sync-alt"></i> Update Progress
                                    </h3>
                                    <div className="progress-buttons">
                                        <button 
                                            onClick={() => updateProgress(progress + 25)} 
                                            disabled={progress >= 100}
                                            className="progress-btn"
                                        >
                                            <i className="fas fa-plus"></i> +25% Progress
                                        </button>
                                        <button 
                                            onClick={() => updateProgress(100)} 
                                            disabled={progress >= 100}
                                            className="complete-btn"
                                        >
                                            <i className="fas fa-check"></i> Mark as Complete
                                        </button>
                                    </div>
                                    
                                    <div className="status-controls">
                                        <h4>Update Status</h4>
                                        <div className="status-buttons">
                                            <button 
                                                onClick={() => updateStatus('in-progress')}
                                                className={`status-btn ${status === 'in-progress' ? 'active' : ''}`}
                                            >
                                                <i className="fas fa-spinner"></i> In Progress
                                            </button>
                                            <button 
                                                onClick={() => updateStatus('completed')}
                                                className={`status-btn ${status === 'completed' ? 'active' : ''}`}
                                            >
                                                <i className="fas fa-check-circle"></i> Completed
                                            </button>
                                            <button 
                                                onClick={() => updateStatus('dropped')}
                                                className={`status-btn ${status === 'dropped' ? 'active' : ''}`}
                                            >
                                                <i className="fas fa-times-circle"></i> Dropped
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="course-material">
                            <div className="material-header">
                                <h2>
                                    <i className="fas fa-book"></i> Course Content
                                </h2>
                            </div>
                            
                            <div className="content-section">
                                <h3>
                                    <i className="fas fa-info-circle"></i> Description
                                </h3>
                                <p>{course.description}</p>
                            </div>
                            
                            <div className="content-section">
                                <h3>
                                    <i className="fas fa-file-alt"></i> Course Materials
                                </h3>
                                <div className="course-content-text">
                                    {course.content}
                                </div>
                            </div>

                            <div className="content-actions">
                                <button className="download-btn">
                                    <i className="fas fa-download"></i> Download Materials
                                </button>
                                <button className="share-btn">
                                    <i className="fas fa-share"></i> Share Course
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CourseDetail;