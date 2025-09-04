import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../stylesheets/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            if (user.role === 'instructor') {
                navigate('/instructor-dashboard');
            } else if (user.role === 'student') {
                navigate('/student-dashboard');
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        if (errors.general) {
            setErrors(prev => ({ ...prev, general: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URL}/auth/login`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            await Swal.fire({
                icon: 'success',
                title: 'Login Successful!',
                text: `Welcome back, ${user.name}!`,
                confirmButtonColor: '#27ae60',
                timer: 1500
            });
            
            if (user.role === 'instructor') {
                navigate('/instructor-dashboard');
            } else if (user.role === 'student') {
                navigate('/student-dashboard');
            } else {
                navigate('/dashboard');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            if (error.response) {
                const errorMessage = error.response.data.message;
                
                if (error.response.status === 400 || error.response.status === 401) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Login Failed',
                        text: errorMessage,
                        confirmButtonColor: '#e74c3c'
                    });
                } else if (error.response.status === 500) {
                    await Swal.fire({
                        icon: 'error',
                        title: 'Server Error',
                        text: 'Server error. Please try again later.',
                        confirmButtonColor: '#e74c3c'
                    });
                }
            } else if (error.code === 'ERR_NETWORK') {
                await Swal.fire({
                    icon: 'error',
                    title: 'Network Error',
                    text: 'Cannot connect to server. Please check your connection.',
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
        <div className="auth-container">
            <div className="auth-card">
                <h2 className="auth-title">Login to Your Account</h2>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input 
                            type="text" 
                            id="username"
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            placeholder="Enter your username" 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input 
                            type="password" 
                            id="password"
                            name="password" 
                            value={formData.password} 
                            onChange={handleChange} 
                            placeholder="Enter your password" 
                            required 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="auth-button"
                    >
                        {isSubmitting ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register" className="auth-link">Register here</Link></p>
                    <p><Link to="/" className="auth-link">← Back to Home</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;