import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/MyCourses.css';

const MyCourses = ({ enrolledCourses, setActiveTab }) => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    const coursesPerPage = 6;
    
    // Calculate pagination
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = enrolledCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(enrolledCourses.length / coursesPerPage);
    
    // Toggle description expansion
    const toggleDescription = (courseId) => {
        setExpandedDescriptions(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };
    
    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    
    // Generate page numbers for pagination
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

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
                <>
                    <div className="enrolled-courses-grid">
                        {currentCourses.map(enrollment => {
                            const isExpanded = expandedDescriptions[enrollment._id];
                            const titleLimit = 50;
                            const descLimit = 120;
                            const truncatedTitle = enrollment.course?.title.length > titleLimit 
                                ? enrollment.course.title.substring(0, titleLimit) + '...' 
                                : enrollment.course?.title || 'Untitled Course';
                            const truncatedDesc = enrollment.course?.description && enrollment.course.description.length > descLimit && !isExpanded
                                ? enrollment.course.description.substring(0, descLimit) + '...'
                                : enrollment.course?.description || 'No description available';
                                
                            return (
                                <div key={enrollment._id} className="enrolled-course-card">
                                    <div className="enrolled-course-header">
                                        <h4 title={enrollment.course?.title}>{truncatedTitle}</h4>
                                        <span className={`status-badge status-${enrollment.status}`}>
                                            {enrollment.status}
                                        </span>
                                    </div>
                                    
                                    <p className="course-description">
                                        {truncatedDesc}
                                        {enrollment.course?.description && enrollment.course.description.length > descLimit && (
                                            <button 
                                                className="see-more-btn"
                                                onClick={() => toggleDescription(enrollment._id)}
                                            >
                                                {isExpanded ? 'See less' : 'See more'}
                                            </button>
                                        )}
                                    </p>
                                    
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
                            );
                        })}
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button 
                                className="pagination-btn"
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                &laquo; Previous
                            </button>
                            
                            {pageNumbers.map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                >
                                    {number}
                                </button>
                            ))}
                            
                            <button 
                                className="pagination-btn"
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyCourses;