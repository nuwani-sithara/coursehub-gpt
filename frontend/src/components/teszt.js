import React, { useState } from 'react';
import Swal from 'sweetalert2';
import '../stylesheets/AIRecommendations.css';

const AIRecommendations = ({ 
    aiPrompt, 
    setAiPrompt, 
    aiRecommendations, 
    getAiRecommendations, 
    enrollInCourse 
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        await getAiRecommendations();
        setIsLoading(false);
    };

    return (
        <div className="ai-recommendations-section">
            <div className="ai-hero">
                <h3>AI Course Recommendations</h3>
                <p>Tell us what you want to learn, and our AI will recommend the perfect courses for you</p>
            </div>
            
            <div className="ai-prompt-section">
                <div className="prompt-input-container">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., I want to be a software engineer, what courses should I follow?"
                        className="prompt-input"
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleGetRecommendations}
                        className="get-recommendations-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <div className="loading-spinner-small"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-robot"></i> Get Recommendations
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="recommendations-loading">
                    <div className="loading-spinner"></div>
                    <p>AI is analyzing your request and finding the best courses for you...</p>
                </div>
            ) : aiRecommendations.length > 0 ? (
                <div className="recommendations-results">
                    <h4>Recommended Courses</h4>
                    <div className="recommendations-grid">
                        {aiRecommendations.map(rec => (
                            <div key={rec.courseId} className="recommendation-card">
                                <div className="recommendation-header">
                                    <h5>{rec.course.title}</h5>
                                    <p className="reason">{rec.reason}</p>
                                </div>
                                <p className="course-description">{rec.course.description}</p>
                                <button 
                                    onClick={() => enrollInCourse(rec.courseId)}
                                    className="enroll-btn"
                                >
                                    <i className="fas fa-plus"></i> Enroll Now
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default AIRecommendations;