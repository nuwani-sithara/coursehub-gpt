import React from 'react';
import '../stylesheets/Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="container">
                <div className="footer-content">
                </div>
                <div className="footer-bottom">
                    <div className="footer-bottom-content">
                        <p>&copy; {new Date().getFullYear()} CourseHub-GPT. All rights reserved.</p>
                        <div className="footer-badges">
                            <span className="badge"><i className="fas fa-lock"></i> Secure</span>
                            <span className="badge"><i className="fas fa-graduation-cap"></i> Accredited</span>
                            <span className="badge"><i className="fas fa-shield-alt"></i> Trusted</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;