import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import '../stylesheets/PersonalizedRecommendations.css';

const PersonalizedRecommendations = ({ 
    personalizedRecommendations, 
    getPersonalizedRecommendations, 
    enrollInCourse,
    enrolledCourses 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        // Automatically fetch personalized recommendations when component mounts
        if (!hasFetched && personalizedRecommendations.length === 0) {
            handleGetPersonalizedRecommendations();
        }
    }, []);

    const handleGetPersonalizedRecommendations = async () => {
        setIsLoading(true);
        try {
            await getPersonalizedRecommendations();
            setHasFetched(true);
        } catch (error) {
            console.error('Error in handleGetPersonalizedRecommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isEnrolled = (courseId) => {
        return enrolledCourses.some(ec => ec.course?._id === courseId);
    };

    return (
        <div className="personalized-recommendations-section">
            <div className="personalized-hero">
                <h3>Recommended For You</h3>
                <p>Courses tailored to your learning journey based on your enrollments and preferences</p>
            </div>

            <div className="personalized-actions">
                <button 
                    onClick={handleGetPersonalizedRecommendations}
                    className="refresh-recommendations-btn"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <div className="loading-spinner-small"></div>
                            Refreshing...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-sync-alt"></i> Refresh Recommendations
                        </>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="recommendations-loading">
                    <div className="loading-spinner"></div>
                    <p>Analyzing your learning pattern to find the perfect courses for you...</p>
                </div>
            ) : personalizedRecommendations.length > 0 ? (
                <div className="recommendations-results">
                    <h4>Personalized Recommendations</h4>
                    <p className="recommendations-subtitle">
                        Based on your learning history and preferences
                    </p>
                    <div className="recommendations-grid">
                        {personalizedRecommendations.map(rec => (
                            <div key={rec.courseId || rec.course._id} className="recommendation-card personalized-card">
                                <div className="recommendation-header">
                                    <h5>{rec.course.title}</h5>
                                    <p className="reason">{rec.reason}</p>
                                    <span className="personalized-badge">
                                        <i className="fas fa-star"></i> Recommended for you
                                    </span>
                                </div>
                                <p className="course-description">{rec.course.description}</p>
                                <div className="course-meta">
                                    <span className={`course-badge course-level-${rec.course.level?.toLowerCase() || 'beginner'}`}>
                                        {rec.course.level || 'Beginner'}
                                    </span>
                                    <span className="course-badge course-category">
                                        {rec.course.category}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => enrollInCourse(rec.courseId || rec.course._id)}
                                    className="enroll-btn"
                                    disabled={isEnrolled(rec.courseId || rec.course._id)}
                                >
                                    {isEnrolled(rec.courseId || rec.course._id) ? (
                                        <>
                                            <i className="fas fa-check"></i> Enrolled
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-plus"></i> Enroll Now
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : hasFetched ? (
                <div className="no-recommendations">
                    <i className="fas fa-search"></i>
                    <h4>No Personalized Recommendations Yet</h4>
                    <p>We need more information about your learning preferences. Enroll in more courses to get better recommendations.</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="try-again-btn"
                    >
                        <i className="fas fa-redo"></i> Try Again
                    </button>
                </div>
            ) : null}
        </div>
    );
};

export default PersonalizedRecommendations;