import axios from "axios";

// Utility functions for authentication
export const getAuthToken = () => {
    return localStorage.getItem('token');
};

export const getUser = () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
    return !!getAuthToken();
};

export const getUserRole = () => {
    const user = getUser();
    return user ? user.role : null;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/login';
};

// Set up axios interceptors
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            logout();
        }
        return Promise.reject(error);
    }
);