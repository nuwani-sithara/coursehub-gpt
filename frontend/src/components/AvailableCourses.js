import React from 'react';
import Swal from 'sweetalert2';
import '../stylesheets/AvailableCourses.css';

const AvailableCourses = ({ courses, enrolledCourses, enrollInCourse }) => {
    return (
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
    );
};

export default AvailableCourses;