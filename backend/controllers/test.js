const { OpenAI } = require('openai');
const { HfInference } = require('@huggingface/inference');
const { CohereClient } = require('cohere-ai');
const Course = require('../models/course');
const Enrollment = require('../models/enrollment');

// Initialize AI clients with better error handling
let openai, hf, cohere;
let apiStatus = {
    openai: { available: false, error: null },
    huggingface: { available: false, error: null },
    cohere: { available: false, error: null }
};

// Request tracking
let requestCount = {
    openai: 0,
    huggingface: 0,
    cohere: 0,
    keyword: 0,
    total: 0
};

// Maximum allowed requests
const MAX_REQUESTS = 250;

// Initialize OpenAI
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        apiStatus.openai.available = true;
        console.log('OpenAI: ✅ Configured successfully');
    } catch (error) {
        apiStatus.openai.available = false;
        apiStatus.openai.error = error.message;
        console.log('OpenAI: ❌ Configuration failed -', error.message);
    }
} else {
    console.log('OpenAI: ❌ API key not provided');
}

// Initialize Hugging Face
if (process.env.HUGGINGFACE_API_KEY) {
    try {
        hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        apiStatus.huggingface.available = true;
        console.log('Hugging Face: ✅ Configured successfully');
    } catch (error) {
        apiStatus.huggingface.available = false;
        apiStatus.huggingface.error = error.message;
        console.log('Hugging Face: ❌ Configuration failed -', error.message);
    }
} else {
    console.log('Hugging Face: ❌ API key not provided');
}

// Initialize Cohere
if (process.env.COHERE_API_KEY) {
    try {
        cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });
        apiStatus.cohere.available = true;
        console.log('Cohere: ✅ Configured successfully');
    } catch (error) {
        apiStatus.cohere.available = false;
        apiStatus.cohere.error = error.message;
        console.log('Cohere: ❌ Configuration failed -', error.message);
    }
} else {
    console.log('Cohere: ❌ API key not provided');
}

// Check request limit
function checkRequestLimit() {
    if (requestCount.total >= MAX_REQUESTS) {
        throw new Error(`API request limit reached (${MAX_REQUESTS} requests). Please contact administrator.`);
    }
    requestCount.total++;
}

// Get API status
exports.getAIStatus = async (req, res) => {
    try {
        res.status(200).json({
            apiStatus,
            requestCount,
            maxRequests: MAX_REQUESTS,
            remainingRequests: MAX_REQUESTS - requestCount.total
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching API status', error: error.message });
    }
};

// Get personalized course recommendations with triple AI providers
exports.getCourseRecommendations = async (req, res) => {
    try {
        checkRequestLimit();
        
        const { prompt, maxCourses = 5 } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        // Get all available courses
        let allCourses = await Course.find({ isPublished: true })
            .populate('instructor', 'name')
            .select('title description category level duration instructor');

        if (allCourses.length === 0) {
            allCourses = await Course.find()
                .populate('instructor', 'name')
                .select('title description category level duration instructor');
        }

        if (allCourses.length === 0) {
            return res.status(404).json({ 
                message: 'No courses available in the system',
                suggestion: 'Please add some courses first' 
            });
        }

        // Format courses for context
        const coursesContext = allCourses.map(course => ({
            id: course._id.toString(),
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            duration: course.duration,
            instructor: course.instructor?.name || 'Unknown Instructor'
        }));

        console.log(`Sending ${coursesContext.length} courses for recommendations`);

        let recommendations;
        let aiProvider = 'OpenAI';
        let providerUsed = '';

        // Try OpenAI first if available
        if (apiStatus.openai.available) {
            try {
                recommendations = await getOpenAIRecommendations(prompt, coursesContext, maxCourses);
                aiProvider = 'OpenAI';
                providerUsed = 'openai';
                requestCount.openai++;
            } catch (openaiError) {
                console.log('OpenAI failed:', openaiError.message);
                // Continue to next provider
            }
        }

        // Try Hugging Face if OpenAI failed or not available
        if (!recommendations && apiStatus.huggingface.available) {
            try {
                recommendations = await getHuggingFaceRecommendations(prompt, coursesContext, maxCourses);
                aiProvider = 'Hugging Face';
                providerUsed = 'huggingface';
                requestCount.huggingface++;
            } catch (hfError) {
                console.log('Hugging Face failed:', hfError.message);
                // Continue to next provider
            }
        }

        // Try Cohere if previous providers failed or not available
        if (!recommendations && apiStatus.cohere.available) {
            try {
                recommendations = await getCohereRecommendations(prompt, coursesContext, maxCourses);
                aiProvider = 'Cohere';
                providerUsed = 'cohere';
                requestCount.cohere++;
            } catch (cohereError) {
                console.log('Cohere failed:', cohereError.message);
                // Continue to fallback
            }
        }

        // Final fallback: enhanced keyword matching
        if (!recommendations || recommendations.length === 0) {
            recommendations = getEnhancedKeywordRecommendations(prompt, allCourses, maxCourses);
            aiProvider = 'Enhanced Keyword Matching';
            providerUsed = 'keyword';
            requestCount.keyword++;
        }

        // Enrich recommendations with course data
        const enrichedRecommendations = await enrichRecommendations(recommendations, allCourses);

        res.status(200).json({
            recommendations: enrichedRecommendations,
            summary: `Found ${enrichedRecommendations.length} courses matching your interest in "${prompt}"`,
            totalRecommended: enrichedRecommendations.length,
            totalAvailable: allCourses.length,
            aiProvider: aiProvider,
            providerUsed: providerUsed,
            requestStats: {
                current: requestCount.total,
                remaining: MAX_REQUESTS - requestCount.total,
                limit: MAX_REQUESTS
            }
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ 
            message: 'Failed to generate recommendations',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            requestStats: {
                current: requestCount.total,
                remaining: MAX_REQUESTS - requestCount.total,
                limit: MAX_REQUESTS
            }
        });
    }
};

// OpenAI recommendation function with better error handling
async function getOpenAIRecommendations(prompt, coursesContext, maxCourses) {
    if (!openai) {
        throw new Error('OpenAI client not initialized');
    }

    const gptPrompt = `
You are a course recommendation assistant for an online learning platform.

Available courses:
${JSON.stringify(coursesContext, null, 2)}

User query: "${prompt}"

Based on the user's query and the available courses above, recommend the most relevant courses.
Consider the course category, level, description, and how well they match the user's needs.

Return your response as a JSON object with this structure:
{
  "recommendations": [
    {
      "courseId": "course_id_1",
      "reason": "Brief explanation why this course is recommended"
    }
  ],
  "summary": "Brief overall summary of recommendations"
}

Recommend maximum ${maxCourses} courses. Only recommend courses that actually exist in the available courses list.
Return only valid JSON without any additional text.
    `;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful course recommendation assistant. Always respond with valid JSON only, no additional text."
                },
                {
                    role: "user",
                    content: gptPrompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            timeout: 10000 // 10 second timeout
        });

        const gptResponse = completion.choices[0].message.content;
        console.log('OpenAI raw response:', gptResponse);

        // Clean the response - remove any non-JSON text
        const jsonMatch = gptResponse.match(/\{[\s\S]*\}/) || gptResponse.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('No JSON found in OpenAI response');
        }

        const result = JSON.parse(jsonMatch[0]);
        return result.recommendations || [];

    } catch (error) {
        console.error('OpenAI API error:', error.message);
        if (error.response) {
            console.error('OpenAI API response error:', error.response.status, error.response.data);
        }
        throw new Error(`OpenAI failed: ${error.message}`);
    }
}

// Hugging Face recommendation function with better error handling
async function getHuggingFaceRecommendations(prompt, coursesContext, maxCourses) {
    if (!hf) {
        throw new Error('Hugging Face client not initialized');
    }

    try {
        const hfPrompt = `
Recommend courses based on: "${prompt}"

Available courses: ${JSON.stringify(coursesContext)}

Return ONLY a JSON array of course recommendations in this format:
[
  {"courseId": "course_id_1", "reason": "Explanation"},
  {"courseId": "course_id_2", "reason": "Explanation"}
]

Maximum ${maxCourses} courses. Only recommend courses that exist in the available list.
        `;

        const response = await hf.textGeneration({
            model: 'google/flan-t5-base',
            inputs: hfPrompt,
            parameters: {
                max_new_tokens: 500,
                temperature: 0.5,
                return_full_text: false
            },
            options: {
                timeout: 15000 // 15 second timeout
            }
        });

        console.log('Hugging Face raw response:', response);

        const responseText = response.generated_text || '';
        let recommendations = [];

        // Try to extract JSON from response
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
                // Handle both array and object formats
                if (Array.isArray(recommendations)) {
                    return recommendations.slice(0, maxCourses);
                } else if (recommendations.recommendations && Array.isArray(recommendations.recommendations)) {
                    return recommendations.recommendations.slice(0, maxCourses);
                }
            }
        } catch (parseError) {
            console.log('Failed to parse Hugging Face response JSON:', parseError.message);
        }

        // If JSON parsing failed, try to extract course IDs
        const idRegex = /["']([a-f0-9]{24})["']/g;
        let match;
        const courseIds = [];
        
        while ((match = idRegex.exec(responseText)) !== null) {
            courseIds.push(match[1]);
        }
        
        if (courseIds.length > 0) {
            return courseIds.slice(0, maxCourses).map(id => ({
                courseId: id,
                reason: "Recommended based on your query"
            }));
        }

        throw new Error('Could not extract recommendations from Hugging Face response');

    } catch (error) {
        console.error('Hugging Face API error:', error.message);
        if (error.response) {
            console.error('Hugging Face API response error:', error.response.status, error.response.data);
        }
        throw new Error(`Hugging Face failed: ${error.message}`);
    }
}

// Cohere recommendation function with better error handling
async function getCohereRecommendations(prompt, coursesContext, maxCourses) {
    if (!cohere) {
        throw new Error('Cohere client not initialized');
    }

    try {
        const coherePrompt = `
Recommend courses based on: "${prompt}"

Available courses: ${JSON.stringify(coursesContext)}

Return ONLY a JSON array of course recommendations in this format:
[
  {"courseId": "course_id_1", "reason": "Explanation"},
  {"courseId": "course_id_2", "reason": "Explanation"}
]

Maximum ${maxCourses} courses. Only recommend courses that exist in the available list.
        `;

        const response = await cohere.generate({
            model: 'command',
            prompt: coherePrompt,
            maxTokens: 500,
            temperature: 0.5,
            k: 0,
            p: 0.75,
            stopSequences: ['}'],

        });

        console.log('Cohere raw response:', response);

        const responseText = response.generations[0].text;
        let recommendations = [];

        // Try to extract JSON from response
        try {
            const jsonMatch = responseText.match(/\[[\s\S]*\]/) || responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                recommendations = JSON.parse(jsonMatch[0]);
                // Handle both array and object formats
                if (Array.isArray(recommendations)) {
                    return recommendations.slice(0, maxCourses);
                } else if (recommendations.recommendations && Array.isArray(recommendations.recommendations)) {
                    return recommendations.recommendations.slice(0, maxCourses);
                }
            }
        } catch (parseError) {
            console.log('Failed to parse Cohere response JSON:', parseError.message);
        }

        // If JSON parsing failed, try to extract course IDs
        const idRegex = /["']([a-f0-9]{24})["']/g;
        let match;
        const courseIds = [];
        
        while ((match = idRegex.exec(responseText)) !== null) {
            courseIds.push(match[1]);
        }
        
        if (courseIds.length > 0) {
            return courseIds.slice(0, maxCourses).map(id => ({
                courseId: id,
                reason: "Recommended based on your query"
            }));
        }

        throw new Error('Could not extract recommendations from Cohere response');

    } catch (error) {
        console.error('Cohere API error:', error.message);
        if (error.response) {
            console.error('Cohere API response error:', error.response.status, error.response.data);
        }
        throw new Error(`Cohere failed: ${error.message}`);
    }
}

// Enhanced keyword-based recommendation function (unchanged)
function getEnhancedKeywordRecommendations(prompt, allCourses, maxCourses) {
    // ... keep the existing implementation unchanged ...
}

// Helper to generate reason based on score (unchanged)
function getReasonFromScore(score, prompt) {
    // ... keep the existing implementation unchanged ...
}

// Helper function to enrich recommendations with course data (unchanged)
async function enrichRecommendations(recommendations, allCourses) {
    // ... keep the existing implementation unchanged ...
}

// Get recommendations based on user's enrollment history (unchanged)
exports.getPersonalizedRecommendations = async (req, res) => {
    // ... keep the existing implementation but add checkRequestLimit() at the beginning ...
};

// Reset request counter (for testing/admin purposes)
exports.resetRequestCount = async (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        requestCount = {
            openai: 0,
            huggingface: 0,
            cohere: 0,
            keyword: 0,
            total: 0
        };
        res.status(200).json({ message: 'Request counter reset', requestCount });
    } else {
        res.status(403).json({ message: 'Reset not allowed in production' });
    }
};