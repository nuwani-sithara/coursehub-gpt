import React from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import '../stylesheets/StudentNavbar.css';

const StudentNavbar = ({ user }) => {
    const navigate = useNavigate();

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

    return (
        <header className="student-header">
            <div className="container">
                <h1 className="student-logo">CourseHub-GPT Student</h1>
                <div className="student-user-info">
                    <span>Welcome! {user?.username}</span>
                    <button onClick={logout} className="student-logout-btn">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default StudentNavbar;