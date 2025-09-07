import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/CourseSection.css';
import axios from 'axios';

const CourseSection = () => {
    const [courses, setCourses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [coursesPerPage] = useState(6); // Show 6 courses per page
    const navigate = useNavigate();

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/courses/all-courses`);
            setCourses(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Get current courses
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = courses.slice(indexOfFirstCourse, indexOfLastCourse);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleEnrollClick = (courseId) => {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        const userRole = localStorage.getItem('userRole');
        
        if (token && userRole === 'student') {
            // User is logged in as student, navigate to course details
            navigate(`/course/${courseId}`);
        } else if (token && userRole !== 'student') {
            // User is logged in but not as student
            alert('Only students can enroll in courses. Please login as a student.');
            navigate('/login');
        } else {
            // User is not logged in, navigate to register page
            navigate('/register', { state: { role: 'student', redirect: `/course/${courseId}` } });
        }
    };

    if (loading) {
        return (
            <section className="courses-section-land">
                <div className="container">
                    <h2>Featured Courses</h2>
                    <div className="loading-spinner">Loading courses...</div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="courses-section-land">
                <div className="container">
                    <h2>Featured Courses</h2>
                    <div className="error-message">
                        <p>{error}</p>
                        <button onClick={fetchCourses} className="btn btn-primary">
                            Try Again
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="courses-section-land">
            <div className="container">
                <h2 color='#2c3e50'>Featured Courses</h2>
                <br />
                {/* <p className="section-subtitle">Discover our most popular courses</p> */}
                
                {courses.length === 0 ? (
                    <div className="no-courses">
                        <i className="fas fa-book-open"></i>
                        <p>No courses available at the moment.</p>
                    </div>
                ) : (
                    <>
                        <div className="courses-grid-land">
                            {currentCourses.map(course => (
                                <div key={course._id} className="course-card-land">
                                    <div className="course-thumbnail-land">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} />
                                        ) : (
                                            <div className="thumbnail-placeholder-land">
                                                <i className="fas fa-book"></i>
                                            </div>
                                        )}
                                        <div className="course-level-land">{course.level}</div>
                                    </div>
                                    
                                    <div className="course-content-land">
                                        <h3 className="course-title-land">{course.title}</h3>
                                        <p className="course-description-land">
                                            {course.description && course.description.length > 100 
                                                ? `${course.description.substring(0, 100)}...` 
                                                : course.description
                                            }
                                        </p>
                                        
                                        <div className="course-meta-land">
                                            <div className="course-instructor-land">
                                                <i className="fas fa-user"></i>
                                                <span>{course.instructor?.name || course.instructor?.username || 'Unknown Instructor'}</span>
                                            </div>
                                            <div className="course-duration-land">
                                                <i className="fas fa-clock"></i>
                                                <span>{course.duration || 'Self-paced'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="course-enrollment-land">
                                            {/* <span className="students-count-land">
                                                <i className="fas fa-users"></i>
                                                {course.students?.length || 0} students
                                            </span> */}
                                            <button 
                                                className="enroll-btn-land"
                                                onClick={() => handleEnrollClick(course._id)}
                                            >
                                                Enroll Now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Pagination */}
                        {courses.length > coursesPerPage && (
                            <div className="pagination-land">
                                {Array.from({ length: Math.ceil(courses.length / coursesPerPage) }, (_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => paginate(i + 1)}
                                        className={`pagination-btn-land ${currentPage === i + 1 ? 'active' : ''}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </section>
    );
};

export default CourseSection;