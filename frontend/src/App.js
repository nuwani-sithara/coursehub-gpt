import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';
import CourseDetail from './components/CourseDetail';
import ProtectedRoute from './components/ProtectedRoute';
import Unauthorized from './components/Unauthorized';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/student-dashboard" element={
                        <ProtectedRoute requiredRole="student">
                            <StudentDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/instructor-dashboard" element={
                        <ProtectedRoute requiredRole="instructor">
                            <InstructorDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/course/:courseId" element={
                        <ProtectedRoute requiredRole="student">
                            <CourseDetail />
                        </ProtectedRoute>
                    } />
                    <Route path="/unauthorized" element={<Unauthorized />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;