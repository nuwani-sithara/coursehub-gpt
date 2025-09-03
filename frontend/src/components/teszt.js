// In your Login.js component, update the handleSubmit function:

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
        
        await Swal.fire({
            icon: 'success',
            title: 'Login Successful!',
            text: `Welcome back, ${user.name}!`,
            confirmButtonColor: '#27ae60',
            timer: 1500
        });
        
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