import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/MyCourses.css';

const MyCourses = ({ enrolledCourses, setActiveTab }) => {
    const navigate = useNavigate();

    const goToCourse = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    return (
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
    );
};

export default MyCourses;