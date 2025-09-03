import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/CourseDetail.css';

const CourseDetail = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('enrolled');

    useEffect(() => {
        fetchCourseDetails();
        fetchEnrollmentDetails();
    }, [courseId]);

    const fetchCourseDetails = async () => {
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
    };

    const fetchEnrollmentDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/enrollments/my-courses`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            const userEnrollment = response.data.find(
                enrollment => enrollment.course?._id === courseId
            );
            
            if (userEnrollment) {
                setEnrollment(userEnrollment);
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
    };

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
        return <div className="loading">Loading...</div>;
    }

    if (!course) {
        return <div className="error">Course not found</div>;
    }

    return (
        <div className="course-detail">
            <header className="course-header">
                <button onClick={goBack} className="back-btn">← Back to Dashboard</button>
                <h1>{course.title}</h1>
            </header>

            <div className="course-content">
                <div className="course-info">
                    <div className="course-meta">
                        <span className="course-category">{course.category}</span>
                        <span className="course-level">{course.level}</span>
                        {course.duration && <span className="course-duration">{course.duration}</span>}
                    </div>
                    
                    <div className="instructor-info">
                        <h3>Instructor</h3>
                        <p>{course.instructor?.name || 'Unknown Instructor'}</p>
                    </div>

                    <div className="enrollment-status">
                        <h3>Your Progress</h3>
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <span>{progress}% Complete</span>
                        </div>
                        <p>Status: {status}</p>
                    </div>

                    <div className="progress-controls">
                        <h3>Update Your Progress</h3>
                        <div className="progress-buttons">
                            <button onClick={() => updateProgress(progress + 25)} disabled={progress >= 100}>
                                +25% Progress
                            </button>
                            <button onClick={() => updateProgress(100)} disabled={progress >= 100}>
                                Mark as Complete
                            </button>
                        </div>
                        
                        <div className="status-controls">
                            <h3>Update Status</h3>
                            <div className="status-buttons">
                                <button 
                                    onClick={() => updateStatus('in-progress')}
                                    className={status === 'in-progress' ? 'active' : ''}
                                >
                                    In Progress
                                </button>
                                <button 
                                    onClick={() => updateStatus('completed')}
                                    className={status === 'completed' ? 'active' : ''}
                                >
                                    Completed
                                </button>
                                <button 
                                    onClick={() => updateStatus('dropped')}
                                    className={status === 'dropped' ? 'active' : ''}
                                >
                                    Dropped
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="course-material">
                    <h2>Course Content</h2>
                    <div className="content-section">
                        <h3>Description</h3>
                        <p>{course.description}</p>
                    </div>
                    
                    <div className="content-section">
                        <h3>Course Materials</h3>
                        <div className="course-content-text">
                            {course.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetail;