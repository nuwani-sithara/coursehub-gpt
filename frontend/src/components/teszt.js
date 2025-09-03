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
        fetchCourses();
    }, []);

    const fetchUserData = () => {
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
    };

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/courses/course-instructor/${user?.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
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
            {/* ... rest of the InstructorDashboard component remains the same ... */}
        </div>
    );
};

export default InstructorDashboard;