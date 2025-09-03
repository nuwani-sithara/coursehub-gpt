import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('my-courses');
    const [courses, setCourses] = useState([]);
    const [enrollments, setEnrollments] = useState({});
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        category: '',
        duration: '',
        level: 'Beginner'
    });

    useEffect(() => {
    fetchUserData();
    }, []);

    useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    console.log("userData from localStorage:", userData);

    if (userData?.id || userData?._id) {
        const instructorId = userData.id || userData._id; // ✅ support both
        fetchCourses(instructorId);
    } else {
        console.error("No instructor ID found in localStorage");
    }
    }, []);

    const fetchUserData = () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
    };

    const fetchCourses = async (instructorId) => {
    try {
        const token = localStorage.getItem("token");
        console.log("Fetching courses for instructorId:", instructorId);

        const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/courses/course-instructor/${instructorId}`,
        { headers: { Authorization: `Bearer ${token}` } }
        );
        setCourses(response.data);
    } catch (error) {
        console.error("Error fetching courses:", error);
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

    const fetchEnrollments = async (courseId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/enrollments/course/${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEnrollments(prev => ({ ...prev, [courseId]: response.data }));
        } catch (error) {
            console.error('Error fetching enrollments:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch enrollments. Please try again later.',
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/courses/create-course`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Course created successfully!',
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
            
            setShowCreateModal(false);
            setFormData({
                title: '',
                description: '',
                content: '',
                category: '',
                duration: '',
                level: 'Beginner'
            });
            fetchCourses();
        } catch (error) {
            console.error('Error creating course:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: `Error creating course: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/courses/update-course/${editingCourse._id}`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Course updated successfully!',
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
            
            setEditingCourse(null);
            setFormData({
                title: '',
                description: '',
                content: '',
                category: '',
                duration: '',
                level: 'Beginner'
            });
            fetchCourses();
        } catch (error) {
            console.error('Error updating course:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: `Error updating course: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        }
    };

    const handleDeleteCourse = async (courseId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This action cannot be undone. All enrollment data for this course will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Yes, delete it!'
        });
        
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(
                    `${process.env.REACT_APP_BACKEND_URL}/courses/delete-course/${courseId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Course deleted successfully!',
                    confirmButtonColor: '#27ae60',
                    timer: 1500
                });
                
                fetchCourses();
            } catch (error) {
                console.error('Error deleting course:', error);
                const errorMessage = error.response?.data?.message || error.message;
                
                await Swal.fire({
                    icon: 'error',
                    title: 'Deletion Failed',
                    text: `Error deleting course: ${errorMessage}`,
                    confirmButtonColor: '#e74c3c'
                });
            }
        }
    };

    const openEditModal = (course) => {
        setEditingCourse(course);
        setFormData({
            title: course.title,
            description: course.description,
            content: course.content,
            category: course.category,
            duration: course.duration,
            level: course.level
        });
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
        <div className="instructor-dashboard">
            <header className="dashboard-header">
                <h1>Instructor Dashboard</h1>
                <div className="user-info">
                    <span>Welcome, {user?.name}</span>
                    <button onClick={logout} className="logout-btn">Logout</button>
                </div>
            </header>

            <div className="dashboard-tabs">
                <button 
                    className={activeTab === 'my-courses' ? 'active' : ''} 
                    onClick={() => setActiveTab('my-courses')}
                >
                    My Courses
                </button>
            </div>

            <div className="dashboard-content">
                {activeTab === 'my-courses' && (
                    <div>
                        <div className="courses-header">
                            <h2>My Courses</h2>
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="create-course-btn"
                            >
                                Create New Course
                            </button>
                        </div>

                        {courses.length === 0 ? (
                            <p>You haven't created any courses yet.</p>
                        ) : (
                            <div className="courses-list">
                                {courses.map(course => (
                                    <div key={course._id} className="course-item">
                                        <div className="course-info">
                                            <h3>{course.title}</h3>
                                            <p>{course.description}</p>
                                            <div className="course-meta">
                                                <span className="course-category">{course.category}</span>
                                                <span className="course-level">{course.level}</span>
                                                <span className="course-duration">{course.duration}</span>
                                            </div>
                                        </div>
                                        <div className="course-actions">
                                            <button 
                                                onClick={() => openEditModal(course)}
                                                className="edit-btn"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => fetchEnrollments(course._id)}
                                                className="view-enrollments-btn"
                                            >
                                                View Enrollments
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCourse(course._id)}
                                                className="delete-btn"
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        {enrollments[course._id] && (
                                            <div className="enrollments-section">
                                                <h4>Enrolled Students</h4>
                                                {enrollments[course._id].length === 0 ? (
                                                    <p>No students enrolled yet.</p>
                                                ) : (
                                                    <table className="enrollments-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Student Name</th>
                                                                <th>Enrollment Date</th>
                                                                <th>Status</th>
                                                                <th>Progress</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {enrollments[course._id].map(enrollment => (
                                                                <tr key={enrollment._id}>
                                                                    <td>{enrollment.student?.name || 'Unknown'}</td>
                                                                    <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                                                                    <td>{enrollment.status}</td>
                                                                    <td>{enrollment.progress}%</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Create New Course</h2>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <input
                                    type="text"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g., 10 hours"
                                />
                            </div>
                            <div className="form-group">
                                <label>Level</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit">Create Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {editingCourse && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2>Edit Course</h2>
                        <form onSubmit={handleUpdateCourse}>
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <input
                                    type="text"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g., 10 hours"
                                />
                            </div>
                            <div className="form-group">
                                <label>Level</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setEditingCourse(null)}>Cancel</button>
                                <button type="submit">Update Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;