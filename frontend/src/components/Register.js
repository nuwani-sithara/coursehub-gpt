import React from "react";
import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

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
            
            console.log(response.data);
            alert('Registration successful! Please login.');
            navigate('Login.js');
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.response) {
                // Server responded with error status
                const errorMessage = error.response.data.message;
                
                if (error.response.status === 400) {
                    // Validation errors from backend
                    setErrors({ general: errorMessage });
                    
                    // You could also parse specific field errors if available
                    if (errorMessage.includes('email')) {
                        setErrors(prev => ({ ...prev, email: errorMessage }));
                    } else if (errorMessage.includes('Username')) {
                        setErrors(prev => ({ ...prev, username: errorMessage }));
                    } else if (errorMessage.includes('Password')) {
                        setErrors(prev => ({ ...prev, password: errorMessage }));
                    }
                } else if (error.response.status === 500) {
                    setErrors({ general: 'Server error. Please try again later.' });
                }
            } else if (error.request) {
                // Network error
                setErrors({ general: 'Network error. Please check your connection.' });
            } else {
                // Other errors
                setErrors({ general: 'An unexpected error occurred.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
            <h2>Register</h2>
            
            {errors.general && (
                <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', border: '1px solid red' }}>
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        placeholder="Full Name" 
                        required 
                        style={{ width: '100%', padding: '10px', marginBottom: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        placeholder="Email" 
                        required 
                        style={{ width: '100%', padding: '10px', marginBottom: '5px' }}
                    />
                    {errors.email && <span style={{ color: 'red', fontSize: '14px' }}>{errors.email}</span>}
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        placeholder="Username" 
                        required 
                        style={{ width: '100%', padding: '10px', marginBottom: '5px' }}
                    />
                    {errors.username && <span style={{ color: 'red', fontSize: '14px' }}>{errors.username}</span>}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        4-20 characters, letters, numbers, and underscores only
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Password" 
                        required 
                        style={{ width: '100%', padding: '10px', marginBottom: '5px' }}
                    />
                    {errors.password && <span style={{ color: 'red', fontSize: '14px' }}>{errors.password}</span>}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <select 
                        name="role" 
                        value={formData.role} 
                        onChange={handleChange} 
                        required 
                        style={{ width: '100%', padding: '10px' }}
                    >
                        <option value="">Select Role</option>
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                    </select>
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: isSubmitting ? '#ccc' : '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer'
                    }}
                >
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <p>Already have an account? <a href="/login" style={{ color: '#007bff' }}>Login here</a></p>
            </div>
        </div>
    );
};

export default Register;