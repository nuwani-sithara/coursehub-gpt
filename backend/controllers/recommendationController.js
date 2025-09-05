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
        console.log('OpenAI: Configured successfully');
    } catch (error) {
        apiStatus.openai.available = false;
        apiStatus.openai.error = error.message;
        console.log('OpenAI: Configuration failed -', error.message);
    }
} else {
    console.log('OpenAI: API key not provided');
}

// Initialize Hugging Face
if (process.env.HUGGINGFACE_API_KEY) {
    try {
        hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
        apiStatus.huggingface.available = true;
        console.log('Hugging Face: Configured successfully');
    } catch (error) {
        apiStatus.huggingface.available = false;
        apiStatus.huggingface.error = error.message;
        console.log('Hugging Face: Configuration failed -', error.message);
    }
} else {
    console.log('Hugging Face: API key not provided');
}

// Initialize Cohere
if (process.env.COHERE_API_KEY) {
    try {
        cohere = new CohereClient({
            token: process.env.COHERE_API_KEY,
        });
        apiStatus.cohere.available = true;
        console.log('Cohere: Configured successfully');
    } catch (error) {
        apiStatus.cohere.available = false;
        apiStatus.cohere.error = error.message;
        console.log('Cohere: Configuration failed -', error.message);
    }
} else {
    console.log('Cohere: API key not provided');
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

        // Try OpenAI
        if (apiStatus.openai.available) {
            try {
                recommendations = await getOpenAIRecommendations(prompt, coursesContext, maxCourses);
                aiProvider = 'OpenAI';
                providerUsed = 'openai';
                requestCount.openai++;
            } catch (openaiError) {
                console.log('OpenAI failed:', openaiError.message);
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

// Enhanced keyword-based recommendation function
function getEnhancedKeywordRecommendations(prompt, allCourses, maxCourses) {
  const promptLower = prompt.toLowerCase();
  
  // Define keyword categories and their weights
  const keywordCategories = {
    programming: ['programming', 'code', 'developer', 'software', 'algorithm', 'script', 'api', 'software engineer'],
    web: ['web', 'website', 'html', 'css', 'javascript', 'react', 'angular', 'vue', 'frontend', 'backend'],
    python: ['python', 'django', 'flask', 'pandas', 'numpy'],
    java: ['java', 'spring', 'jvm'],
    data: ['data', 'database', 'sql', 'nosql', 'mongodb', 'analysis', 'analytics'],
    ai: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'neural', 'deep learning'],
    design: ['design', 'ux', 'ui', 'user experience', 'user interface', 'graphic', 'figma'],
    business: ['business', 'marketing', 'finance', 'management', 'entrepreneur', 'startup'],
    beginner: ['beginner', 'intro', 'introduction', 'basic', 'fundamental', 'starter'],
    advanced: ['advanced', 'expert', 'professional', 'master', 'deep dive']
  };

  // Score courses based on keyword matching
  const scoredCourses = allCourses.map(course => {
    let score = 0;
    const courseText = `${course.title} ${course.description} ${course.category}`.toLowerCase();
    
    // Check keyword categories
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      const categoryMatch = keywords.some(keyword => 
        promptLower.includes(keyword) && courseText.includes(keyword)
      );
      if (categoryMatch) {
        score += 10;
      }
    }
    
    // Check individual word matches
    const promptWords = promptLower.split(/\s+/).filter(word => word.length > 3);
    for (const word of promptWords) {
      if (courseText.includes(word)) {
        score += 3;
      }
    }
    
    // Bonus for exact title matches
    if (promptLower.includes(course.title.toLowerCase())) {
      score += 15;
    }
    
    // Bonus for category matches
    if (promptLower.includes(course.category.toLowerCase())) {
      score += 12;
    }
    
    return { course, score };
  });

  // Filter out zero-score courses and sort
  const filteredCourses = scoredCourses.filter(item => item.score > 0);
  
  if (filteredCourses.length === 0) {
    // If no matches, return diverse courses from different categories
    return allCourses
      .sort(() => Math.random() - 0.5)
      .slice(0, maxCourses)
      .map(course => ({
        courseId: course._id.toString(),
        reason: "You might be interested in this course"
      }));
  }

  // Return top scored courses
  return filteredCourses
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCourses)
    .map(item => ({
      courseId: item.course._id.toString(),
      reason: getReasonFromScore(item.score, prompt)
    }));
}

// Helper to generate reason based on score
function getReasonFromScore(score, prompt) {
  if (score > 20) return `Highly relevant to your interest in ${prompt}`;
  if (score > 10) return `Matches your interest in ${prompt}`;
  return `Related to your search for ${prompt}`;
}

// Helper function to enrich recommendations with course data
async function enrichRecommendations(recommendations, allCourses) {
  const courseMap = new Map();
  allCourses.forEach(course => {
    courseMap.set(course._id.toString(), course);
  });

  return recommendations
    .map(rec => {
      const course = courseMap.get(rec.courseId);
      if (!course) return null;

      return {
        ...rec,
        course: {
          _id: course._id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          duration: course.duration,
          price: course.price,
          instructor: course.instructor
        }
      };
    })
    .filter(rec => rec !== null);
}

// Get recommendations based on user's enrollment history
exports.getPersonalizedRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { maxCourses = 5 } = req.body;

    // Get user's enrolled courses
    const userEnrollments = await Enrollment.find({ student: userId })
      .populate('course', 'category level');
    
    // Get all available courses
    let allCourses = await Course.find({ isPublished: true })
      .populate('instructor', 'name')
      .select('title description category level duration price instructor');

    if (allCourses.length === 0) {
      allCourses = await Course.find()
        .populate('instructor', 'name')
        .select('title description category level duration price instructor');
    }

    if (allCourses.length === 0) {
      return res.status(404).json({ 
        message: 'No courses available in the system',
        suggestion: 'Please add some courses first' 
      });
    }

    // Prepare context for AI
    const userContext = {
      enrolledCourses: userEnrollments.map(enrollment => ({
        category: enrollment.course?.category || 'Unknown',
        level: enrollment.course?.level || 'beginner'
      })),
      availableCourses: allCourses.map(course => ({
        id: course._id.toString(),
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        duration: course.duration,
        price: course.price,
        instructor: course.instructor?.name || 'Unknown Instructor'
      }))
    };

    let recommendations;
    let aiProvider = 'OpenAI';

    try {
      // Try to get AI-based recommendations
      const prompt = `User has enrolled in these courses: ${JSON.stringify(userContext.enrolledCourses)}. Suggest complementary courses.`;
      recommendations = await getOpenAIRecommendations(prompt, userContext.availableCourses, maxCourses);
      aiProvider = 'OpenAI';
    } catch (openaiError) {
      console.log('OpenAI failed for personalized recommendations:', openaiError.message);
      
      try {
        recommendations = await getHuggingFaceRecommendations(
          "Suggest courses based on user's learning history", 
          userContext.availableCourses, 
          maxCourses
        );
        aiProvider = 'Hugging Face';
      } catch (hfError) {
        console.log('Hugging Face failed, trying Cohere:', hfError.message);
        
        try {
          recommendations = await getCohereRecommendations(
            "Suggest courses based on user's learning history", 
            userContext.availableCourses, 
            maxCourses
          );
          aiProvider = 'Cohere';
        } catch (cohereError) {
          console.log('All AI providers failed, using category-based matching:', cohereError.message);
          
          // Fallback: recommend courses in similar categories
          const userCategories = [...new Set(userContext.enrolledCourses.map(ec => ec.category))];
          recommendations = allCourses
            .filter(course => userCategories.includes(course.category))
            .slice(0, maxCourses)
            .map(course => ({
              courseId: course._id.toString(),
              reason: `Similar to your interests in ${course.category}`
            }));
          aiProvider = 'Category Matching';
        }
      }
    }

    // Enrich with course data
    const enrichedRecommendations = await enrichRecommendations(recommendations, allCourses);

    res.status(200).json({
      recommendations: enrichedRecommendations,
      summary: `Recommended ${enrichedRecommendations.length} courses based on your learning history`,
      basedOn: `your ${userEnrollments.length} enrolled courses`,
      totalAvailable: allCourses.length,
      aiProvider: aiProvider
    });

  } catch (error) {
    console.error('Personalized recommendation error:', error);
    res.status(500).json({ message: 'Failed to generate personalized recommendations' });
  }
};

// Reset request counter
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


// Test endpoint for GPT AI only
exports.testGPT = async (req, res) => {
    try {
        checkRequestLimit();
        
        const { prompt, maxCourses = 3 } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        // Get all available courses
        let allCourses = await Course.find({ isPublished: true })
            .populate('instructor', 'name')
            .select('title description category level duration instructor');

        if (allCourses.length === 0) {
            return res.status(404).json({ 
                message: 'No courses available for testing',
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

        console.log('Testing GPT with prompt:', prompt);
        console.log('Available courses:', coursesContext.length);

        let recommendations;
        let gptResponseRaw = '';

        if (!apiStatus.openai.available) {
            return res.status(500).json({ 
                message: 'OpenAI is not configured properly',
                error: apiStatus.openai.error,
                apiStatus: apiStatus.openai
            });
        }

        try {
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
                timeout: 15000
            });

            gptResponseRaw = completion.choices[0].message.content;
            console.log('GPT Raw Response:', gptResponseRaw);

            // Clean the response - remove any non-JSON text
            const jsonMatch = gptResponseRaw.match(/\{[\s\S]*\}/) || gptResponseRaw.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON found in GPT response');
            }

            const result = JSON.parse(jsonMatch[0]);
            recommendations = result.recommendations || [];
            requestCount.openai++;

        } catch (gptError) {
            console.error('GPT Test Error:', gptError.message);
            if (gptError.response) {
                console.error('GPT API Response Error:', gptError.response.status, gptError.response.data);
            }
            
            return res.status(500).json({ 
                message: 'GPT API test failed',
                error: gptError.message,
                rawResponse: gptResponseRaw,
                suggestion: 'Check OpenAI API key and network connectivity'
            });
        }

        // Enrich recommendations with course data
        const enrichedRecommendations = await enrichRecommendations(recommendations, allCourses);

        res.status(200).json({
            success: true,
            recommendations: enrichedRecommendations,
            summary: `GPT found ${enrichedRecommendations.length} courses matching your interest in "${prompt}"`,
            prompt: prompt,
            rawResponse: gptResponseRaw,
            totalCoursesAvailable: allCourses.length,
            requestStats: {
                current: requestCount.total,
                remaining: MAX_REQUESTS - requestCount.total,
                limit: MAX_REQUESTS,
                openaiRequests: requestCount.openai
            },
            apiStatus: {
                openai: apiStatus.openai
            }
        });

    } catch (error) {
        console.error('GPT Test Overall Error:', error);
        res.status(500).json({ 
            message: 'GPT test failed',
            error: error.message,
            requestStats: {
                current: requestCount.total,
                remaining: MAX_REQUESTS - requestCount.total,
                limit: MAX_REQUESTS
            }
        });
    }
};

// Test endpoint for simple GPT connectivity check
exports.testGPTConnectivity = async (req, res) => {
    try {
        if (!apiStatus.openai.available) {
            return res.status(500).json({ 
                success: false,
                message: 'OpenAI is not configured',
                error: apiStatus.openai.error
            });
        }

        // Simple test prompt to check if GPT is working
        const testPrompt = "Hello, are you working? Respond with a simple JSON: {\"status\": \"working\", \"message\": \"GPT is connected successfully\"}";

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a test assistant. Always respond with valid JSON only."
                },
                {
                    role: "user",
                    content: testPrompt
                }
            ],
            temperature: 0.1,
            max_tokens: 100,
            timeout: 10000
        });

        const response = completion.choices[0].message.content;
        let result;
        
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                result = { rawResponse: response };
            }
        } catch (parseError) {
            result = { rawResponse: response, parseError: parseError.message };
        }

        requestCount.openai++;
        requestCount.total++;

        res.status(200).json({
            success: true,
            message: 'GPT connectivity test completed',
            response: result,
            apiStatus: apiStatus.openai,
            requestStats: {
                openaiRequests: requestCount.openai,
                totalRequests: requestCount.total,
                remaining: MAX_REQUESTS - requestCount.total
            }
        });

    } catch (error) {
        console.error('GPT Connectivity Test Error:', error.message);
        res.status(500).json({ 
            success: false,
            message: 'GPT connectivity test failed',
            error: error.message,
            apiStatus: apiStatus.openai,
            suggestion: 'Check OpenAI API key, internet connection, and API status'
        });
    }
};