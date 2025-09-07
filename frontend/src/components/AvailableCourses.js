import React, { useState } from 'react';
import '../stylesheets/AvailableCourses.css';

const AvailableCourses = ({ courses, enrolledCourses, enrollInCourse }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    const coursesPerPage = 6;
    
    // Calculate pagination
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(courses.length / coursesPerPage);
    
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

    return (
        <div className="courses-section">
            <h3>Available Courses</h3>
            {courses.length === 0 ? (
                <div className="no-courses-stu">
                    <i className="fas fa-book-open"></i>
                    <h4>No Courses Available</h4>
                    <p>There are currently no courses available. Please check back later.</p>
                </div>
            ) : (
                <>
                    <div className="courses-grid-stu">
                        {currentCourses.map(course => {
                            const isExpanded = expandedDescriptions[course._id];
                            const titleLimit = 50;
                            const descLimit = 120;
                            const truncatedTitle = course.title.length > titleLimit 
                                ? course.title.substring(0, titleLimit) + '...' 
                                : course.title;
                            const truncatedDesc = course.description.length > descLimit && !isExpanded
                                ? course.description.substring(0, descLimit) + '...'
                                : course.description;
                                
                            return (
                                <div key={course._id} className="course-card-stu">
                                    <div className="course-card-header-stu">
                                        <h4 title={course.title}>{truncatedTitle}</h4>
                                        <div className="course-meta">
                                            <span className={`course-badge course-level-${course.level?.toLowerCase() || 'beginner'}`}>
                                                {course.level || 'Beginner'}
                                            </span>
                                            <span className="course-badge course-category-stu">
                                                {course.category}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="course-description-stu">
                                        {truncatedDesc}
                                        {course.description.length > descLimit && (
                                            <button 
                                                className="see-more-btn"
                                                onClick={() => toggleDescription(course._id)}
                                            >
                                                {isExpanded ? 'See less' : 'See more'}
                                            </button>
                                        )}
                                    </p>
                                    
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

export default AvailableCourses;