import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getUserRole } from '../utils/authUtils';

const ProtectedRoute = ({ children, requiredRole }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const userRole = getUserRole();
    
    if (requiredRole && userRole !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        if (userRole === 'instructor') {
            return <Navigate to="/instructor-dashboard" replace />;
        } else if (userRole === 'student') {
            return <Navigate to="/student-dashboard" replace />;
        }
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;