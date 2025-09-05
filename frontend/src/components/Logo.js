import React from 'react';
import '../stylesheets/Logo.css';

const Logo = () => {
    return (
        <div className="auth-logo">
            <img 
                src="/logo-new.png" 
                alt="CourseHub-GPT Logo" 
                className="logo-image"
            />
            <h1 className="logo-text">CourseHub-GPT</h1>
        </div>
    );
};

export default Logo;