import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

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
            
            // Store token and user data in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            
            // Set default Authorization header for future requests
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            console.log('Login successful:', user);
            
            // Redirect based on user role
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
                
                if (error.response.status === 400) {
                    setErrors({ general: errorMessage });
                } else if (error.response.status === 401) {
                    setErrors({ general: 'Invalid credentials' });
                } else if (error.response.status === 500) {
                    setErrors({ general: 'Server error. Please try again later.' });
                }
            } else if (error.code === 'ERR_NETWORK') {
                setErrors({ 
                    general: 'Cannot connect to server. Please make sure the backend is running.' 
                });
            } else {
                setErrors({ general: 'An unexpected error occurred.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if user is already logged in
    React.useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
            // Redirect based on role if already logged in
            if (user.role === 'instructor') {
                navigate('/instructor-dashboard');
            } else if (user.role === 'student') {
                navigate('/student-dashboard');
            }
        }
    }, [navigate]);

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '50px auto', 
            padding: '30px', 
            border: '1px solid #ddd', 
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
            <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
                Login to Your Account
            </h2>
            
            {errors.general && (
                <div style={{ 
                    color: '#d32f2f', 
                    backgroundColor: '#ffebee', 
                    padding: '12px', 
                    borderRadius: '4px', 
                    marginBottom: '20px',
                    border: '1px solid #ef5350'
                }}>
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontWeight: 'bold',
                        color: '#555'
                    }}>
                        Username
                    </label>
                    <input 
                        type="text" 
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        placeholder="Enter your username" 
                        required 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />
                    {errors.username && (
                        <span style={{ color: '#d32f2f', fontSize: '14px' }}>
                            {errors.username}
                        </span>
                    )}
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={{ 
                        display: 'block', 
                        marginBottom: '5px', 
                        fontWeight: 'bold',
                        color: '#555'
                    }}>
                        Password
                    </label>
                    <input 
                        type="password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        placeholder="Enter your password" 
                        required 
                        style={{ 
                            width: '100%', 
                            padding: '12px', 
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px'
                        }}
                    />
                    {errors.password && (
                        <span style={{ color: '#d32f2f', fontSize: '14px' }}>
                            {errors.password}
                        </span>
                    )}
                </div>

                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: isSubmitting ? '#9e9e9e' : '#1976d2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                        if (!isSubmitting) {
                            e.target.style.backgroundColor = '#1565c0';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isSubmitting) {
                            e.target.style.backgroundColor = '#1976d2';
                        }
                    }}
                >
                    {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
            </form>

            <div style={{ 
                marginTop: '25px', 
                textAlign: 'center',
                paddingTop: '20px',
                borderTop: '1px solid #eee'
            }}>
                <p style={{ color: '#666', margin: 0 }}>
                    Don't have an account?{' '}
                    <a 
                        href="/register" 
                        style={{ 
                            color: '#1976d2', 
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                    >
                        Register here
                    </a>
                </p>
                
                <div style={{ 
                    marginTop: '15px',
                    fontSize: '14px',
                    color: '#757575'
                }}>
                </div>
            </div>
        </div>
    );
};

export default Login;