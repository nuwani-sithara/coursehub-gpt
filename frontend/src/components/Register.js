import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/Auth.css';
import Logo from './Logo';
import Footer from "./Footer";

const Register = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: ''
    });

    useEffect(() => {
        // Set role from navigation state if available
        if (location.state?.role) {
            setFormData(prev => ({ ...prev, role: location.state.role }));
        }
    }, [location.state]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        // Client-side validation
        if (!formData.role) {
            await Swal.fire({
                icon: 'warning',
                title: 'Role Required',
                text: 'Please select a role (student or instructor).',
                confirmButtonColor: '#f39c12'
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/users/register`, 
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            await Swal.fire({
                icon: 'success',
                title: 'Registration Successful!',
                text: 'Your account has been created successfully. You can now login.',
                confirmButtonColor: '#27ae60'
            });
            
            navigate('/');
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.response) {
                const errorMessage = error.response.data.message;
                
                if (error.response.status === 400) {
                    // Parse specific field errors
                    if (errorMessage.includes('email')) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Email Error',
                            text: errorMessage,
                            confirmButtonColor: '#e74c3c'
                        });
                    } else if (errorMessage.includes('Username')) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Username Error',
                            text: errorMessage,
                            confirmButtonColor: '#e74c3c'
                        });
                    } else if (errorMessage.includes('Password')) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Password Error',
                            text: errorMessage,
                            confirmButtonColor: '#e74c3c'
                        });
                    } else if (errorMessage.includes('required')) {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Missing Information',
                            text: errorMessage,
                            confirmButtonColor: '#e74c3c'
                        });
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Registration Failed',
                            text: errorMessage,
                            confirmButtonColor: '#e74c3c'
                        });
                    }
                } else if (error.response.status === 500) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Server Error',
                        text: 'Server error. Please try again later.',
                        confirmButtonColor: '#e74c3c'
                    });
                }
            } else if (error.request) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Network error. Please check your connection.',
                    confirmButtonColor: '#e74c3c'
                });
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An unexpected error occurred.',
                    confirmButtonColor: '#e74c3c'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <><div className="auth-container">
            <div className="auth-card">
                <Logo />
                <h2 className="auth-title">Create Your Account</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your full name"
                            required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required />
                    </div>

                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            required />
                        <div className="input-help">
                            4-20 characters, letters, numbers, and underscores only
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a password"
                            required />
                        <div className="input-help">
                            Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="role">I want to join as</label>
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Role</option>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="auth-button"
                    >
                        {isSubmitting ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login" className="auth-link">Login here</Link></p>
                    <p><Link to="/" className="auth-link">← Back to Home</Link></p>
                </div>
            </div>

        </div><Footer /></>
    );
};

export default Register;