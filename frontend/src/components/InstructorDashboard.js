import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/InstructorDashboard.css';
import Footer from './Footer';

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
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [featuredImageFile, setFeaturedImageFile] = useState(null);
    const [attachmentFile, setAttachmentFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const userData = JSON.parse(localStorage.getItem("user"));
        console.log("userData from localStorage:", userData);

        if (userData?.id || userData?._id) {
            const instructorId = userData.id || userData._id;
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
        setUploading(true);
        
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            
            // Add text fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Add files if they exist
            if (thumbnailFile) {
                formDataToSend.append('thumbnail', thumbnailFile);
            }
            if (featuredImageFile) {
                formDataToSend.append('featuredImage', featuredImageFile);
            }
            
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/courses/create-course`,
                formDataToSend,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
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
            setThumbnailFile(null);
            setFeaturedImageFile(null);
            
            // Refresh courses list
            const userData = JSON.parse(localStorage.getItem("user"));
            const instructorId = userData.id || userData._id;
            fetchCourses(instructorId);
        } catch (error) {
            console.error('Error creating course:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Creation Failed',
                text: `Error creating course: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateCourse = async (e) => {
        e.preventDefault();
        setUploading(true);
        
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            
            // Add text fields
            Object.keys(formData).forEach(key => {
                formDataToSend.append(key, formData[key]);
            });
            
            // Add files if they exist
            if (thumbnailFile) {
                formDataToSend.append('thumbnail', thumbnailFile);
            }
            if (featuredImageFile) {
                formDataToSend.append('featuredImage', featuredImageFile);
            }
            
            const response = await axios.put(
                `${process.env.REACT_APP_BACKEND_URL}/courses/update-course/${editingCourse._id}`,
                formDataToSend,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
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
            setThumbnailFile(null);
            setFeaturedImageFile(null);
            
            // Refresh courses list
            const userData = JSON.parse(localStorage.getItem("user"));
            const instructorId = userData.id || userData._id;
            fetchCourses(instructorId);
        } catch (error) {
            console.error('Error updating course:', error);
            const errorMessage = error.response?.data?.message || error.message;
            
            await Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: `Error updating course: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleAddAttachment = async (courseId) => {
        if (!attachmentFile) {
            await Swal.fire({
                icon: 'warning',
                title: 'No File Selected',
                text: 'Please select a file to upload as attachment.',
                confirmButtonColor: '#f39c12'
            });
            return;
        }

        setUploading(true);
        
        try {
            const token = localStorage.getItem('token');
            const formDataToSend = new FormData();
            formDataToSend.append('file', attachmentFile);
            
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/courses/${courseId}/attachments`,
                formDataToSend,
                { 
                    headers: { 
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Attachment uploaded successfully!',
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
            
            setAttachmentFile(null);
            
            // Refresh courses list
            const userData = JSON.parse(localStorage.getItem("user"));
            const instructorId = userData.id || userData._id;
            fetchCourses(instructorId);
        } catch (error) {
            console.error('Error uploading attachment:', error);
            // If first attempt fails, try with field name "attachment"
            if (error.response?.status === 400) {
                try {
                    const token = localStorage.getItem('token');

                    console.log('Trying field name: attachment');
                    const formDataToSend = new FormData();
                    formDataToSend.append('attachment', attachmentFile);
                    
                    const retryResponse = await axios.post(
                        `${process.env.REACT_APP_BACKEND_URL}/courses/${courseId}/attachments`,
                        formDataToSend,
                        { 
                            headers: { 
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data'
                            } 
                        }
                    );
                    
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Attachment uploaded successfully!',
                        confirmButtonColor: '#27ae60',
                        timer: 1500
                    });
                    
                    setAttachmentFile(null);
                    const userData = JSON.parse(localStorage.getItem("user"));
                    const instructorId = userData.id || userData._id;
                    fetchCourses(instructorId);
                    return;
                } catch (retryError) {
                    console.error('Error with field name "attachment":', retryError.response?.data);
                    error = retryError;
                }
            }
            
            // Show error message
            let errorMessage = 'Failed to upload attachment';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            await Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: `Error uploading attachment: ${errorMessage}`,
                confirmButtonColor: '#e74c3c'
            });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (courseId, attachmentId) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'This attachment will be permanently deleted.',
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
                    `${process.env.REACT_APP_BACKEND_URL}/courses/${courseId}/attachments/${attachmentId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                
                await Swal.fire({
                    icon: 'success',
                    title: 'Deleted!',
                    text: 'Attachment deleted successfully!',
                    confirmButtonColor: '#27ae60',
                    timer: 1500
                });
                
                // Refresh courses list
                const userData = JSON.parse(localStorage.getItem("user"));
                const instructorId = userData.id || userData._id;
                fetchCourses(instructorId);
            } catch (error) {
                console.error('Error deleting attachment:', error);
                const errorMessage = error.response?.data?.message || error.message;
                
                await Swal.fire({
                    icon: 'error',
                    title: 'Deletion Failed',
                    text: `Error deleting attachment: ${errorMessage}`,
                    confirmButtonColor: '#e74c3c'
                });
            }
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
                
                // Refresh courses list
                const userData = JSON.parse(localStorage.getItem("user"));
                const instructorId = userData.id || userData._id;
                fetchCourses(instructorId);
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
        setThumbnailFile(null);
        setFeaturedImageFile(null);
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
                navigate('/');
                
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
        return (
            <div className="instructor-dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading your courses...</p>
            </div>
        );
    }

    return (
        <div className="instructor-dashboard">
            <header className="instructor-header">
                <div className="container">
                    <h1 className="instructor-logo">CourseHub-GPT Instructor</h1>
                    <div className="instructor-user-info">
                        <span>Welcome! {user?.username}</span>
                        <button onClick={logout} className="instructor-logout-btn">
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="instructor-main">
                <div className="container">
                    <div className="instructor-hero">
                        <h2>Manage Your Courses</h2>
                        <p>Create, edit, and monitor your courses and student enrollments</p>
                    </div>

                    <div className="instructor-content">
                        <div className="courses-header">
                            <h3>My Courses</h3>
                            <button 
                                onClick={() => setShowCreateModal(true)}
                                className="create-course-btn"
                            >
                                <i className="fas fa-plus"></i> Create New Course
                            </button>
                        </div>

                        {courses.length === 0 ? (
                            <div className="no-courses">
                                <i className="fas fa-book-open"></i>
                                <h4>No Courses Yet</h4>
                                <p>You haven't created any courses. Start by creating your first course!</p>
                                <button 
                                    onClick={() => setShowCreateModal(true)}
                                    className="create-course-btn"
                                >
                                    <i className="fas fa-plus"></i> Create Your First Course
                                </button>
                            </div>
                        ) : (
                             <div className="courses-list"> {/* Changed from courses-list to courses-grid */}
                                {courses.map(course => (
                                    <div key={course._id} className="course-card">
                                        <div className="course-card-header">
                                            <h4>{course.title}</h4>
                                            <div className="course-meta">
                                                <span className={`course-badge course-level-${course.level.toLowerCase()}`}>
                                                    {course.level}
                                                </span>
                                                <span className="course-badge course-category">
                                                    {course.category}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {course.thumbnail && (
                                            <div className="course-thumbnail">
                                                <img src={course.thumbnail} alt={course.title} />
                                            </div>
                                        )}
                                        
                                        <p className="course-description">{course.description}</p>
                                        
                                        {course.duration && (
                                            <div className="course-duration">
                                                <i className="fas fa-clock"></i> {course.duration}
                                            </div>
                                        )}

                                        {/* Attachments Section */}
                                        {course.attachments && course.attachments.length > 0 && (
                                            <div className="attachments-section">
                                                <h5>Attachments ({course.attachments.length})</h5>
                                                <div className="attachments-list">
                                                    {course.attachments.map(attachment => (
                                                        <div key={attachment._id} className="attachment-item">
                                                            <div className="attachment-info">
                                                                <i className="fas fa-file"></i>
                                                                <span>{attachment.filename}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleDeleteAttachment(course._id, attachment._id)}
                                                                className="attachment-delete-btn"
                                                                title="Delete attachment"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Add Attachment Section */}
                                        <div className="add-attachment-section">
                                            <h5>Add New Attachment</h5>
                                            <div className="attachment-input">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setAttachmentFile(e.target.files[0])}
                                                    className="file-input"
                                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                                />
                                                <button 
                                                    onClick={() => handleAddAttachment(course._id)}
                                                    className="add-attachment-btn"
                                                    disabled={!attachmentFile || uploading}
                                                >
                                                    {uploading ? 'Uploading...' : 'Add Attachment'}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="course-actions">
                                            <button 
                                                onClick={() => openEditModal(course)}
                                                className="course-action-btn edit-btn"
                                            >
                                                <i className="fas fa-edit"></i> Edit
                                            </button>
                                            <button 
                                                onClick={() => fetchEnrollments(course._id)}
                                                className="course-action-btn enrollments-btn"
                                            >
                                                <i className="fas fa-users"></i> Enrollments
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCourse(course._id)}
                                                className="course-action-btn delete-btn"
                                            >
                                                <i className="fas fa-trash"></i> Delete
                                            </button>
                                        </div>

                                        {enrollments[course._id] && (
                                            <div className="enrollments-section">
                                                <h5>Enrolled Students ({enrollments[course._id].length})</h5>
                                                {enrollments[course._id].length === 0 ? (
                                                    <p className="no-enrollments">No students enrolled yet.</p>
                                                ) : (
                                                    <div className="enrollments-table-container">
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
                                                                        <td>
                                                                            <span className={`status-badge status-${enrollment.status}`}>
                                                                                {enrollment.status}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <div className="progress-container">
                                                                                <div className="progress-bar">
                                                                                    <div 
                                                                                        className="progress-fill" 
                                                                                        style={{ width: `${enrollment.progress}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                                <span>{enrollment.progress}%</span>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Course Modal */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Create New Course</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="Enter course title"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    placeholder="Enter course description"
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    placeholder="Enter course content/materials"
                                    rows="5"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    required
                                    placeholder="e.g., Programming, Design, Business"
                                />
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <input
                                    type="text"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="e.g., 10 hours, 4 weeks"
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
                            
                            {/* File Upload Sections */}
                            <div className="form-group">
                                <label>Thumbnail Image (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                                    accept="image/*"
                                />
                                <div className="input-help">
                                    Recommended: 800x600px, JPG/PNG format
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Featured Image (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFeaturedImageFile(e.target.files[0])}
                                    accept="image/*"
                                />
                                <div className="input-help">
                                    Optional larger image for course display
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={uploading}>
                                    {uploading ? 'Creating...' : 'Create Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Course Modal */}
            {editingCourse && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2>Edit Course</h2>
                            <button 
                                className="modal-close"
                                onClick={() => setEditingCourse(null)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateCourse}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    rows="3"
                                />
                            </div>
                            <div className="form-group">
                                <label>Content *</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    required
                                    rows="5"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category *</label>
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
                            
                            {/* File Upload Sections for Edit */}
                            <div className="form-group">
                                <label>Update Thumbnail Image (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                                    accept="image/*"
                                />
                                <div className="input-help">
                                    Leave empty to keep current thumbnail
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Update Featured Image (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setFeaturedImageFile(e.target.files[0])}
                                    accept="image/*"
                                />
                                <div className="input-help">
                                    Leave empty to keep current featured image
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => setEditingCourse(null)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={uploading}>
                                    {uploading ? 'Updating...' : 'Update Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default InstructorDashboard;