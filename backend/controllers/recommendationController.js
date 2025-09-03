const { OpenAI } = require('openai');
const { HfInference } = require('@huggingface/inference');
const { CohereClient } = require('cohere-ai'); // Updated import
const Course = require('../models/course');
const Enrollment = require('../models/enrollment');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Initialize Cohere client
let cohere;
if (process.env.COHERE_API_KEY) {
  cohere = new CohereClient({
    token: process.env.COHERE_API_KEY, // Use 'token' instead of init
  });
}

console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing');
console.log('HF Key:', process.env.HUGGINGFACE_API_KEY ? 'Loaded' : 'Missing');
console.log('Cohere Key:', process.env.COHERE_API_KEY ? 'Loaded' : 'Missing');

// Get personalized course recommendations with triple AI providers
exports.getCourseRecommendations = async (req, res) => {
  try {
    const { prompt, maxCourses = 5 } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

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

    // Format courses for context
    const coursesContext = allCourses.map(course => ({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      price: course.price,
      instructor: course.instructor?.name || 'Unknown Instructor'
    }));

    console.log(`Sending ${coursesContext.length} courses for recommendations`);

    let recommendations;
    let aiProvider = 'OpenAI';

    // Try OpenAI first
    try {
      recommendations = await getOpenAIRecommendations(prompt, coursesContext, maxCourses);
      aiProvider = 'OpenAI';
    } catch (openaiError) {
      console.log('OpenAI failed, trying Hugging Face:', openaiError.message);
      
      // Try Hugging Face as fallback
      try {
        recommendations = await getHuggingFaceRecommendations(prompt, coursesContext, maxCourses);
        aiProvider = 'Hugging Face';
      } catch (hfError) {
        console.log('Hugging Face failed, trying Cohere:', hfError.message);
        
        // Try Cohere as third option
        try {
          recommendations = await getCohereRecommendations(prompt, coursesContext, maxCourses);
          aiProvider = 'Cohere';
        } catch (cohereError) {
          console.log('All AI providers failed, using enhanced keyword matching:', cohereError.message);
          
          // Final fallback: enhanced keyword matching
          recommendations = getEnhancedKeywordRecommendations(prompt, allCourses, maxCourses);
          aiProvider = 'Enhanced Keyword Matching';
        }
      }
    }

    // Enrich recommendations with course data
    const enrichedRecommendations = await enrichRecommendations(recommendations, allCourses);

    res.status(200).json({
      recommendations: enrichedRecommendations,
      summary: `Found ${enrichedRecommendations.length} courses matching your interest in "${prompt}"`,
      totalRecommended: enrichedRecommendations.length,
      totalAvailable: allCourses.length,
      aiProvider: aiProvider
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// OpenAI recommendation function
async function getOpenAIRecommendations(prompt, coursesContext, maxCourses) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
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
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful course recommendation assistant. Always respond with valid JSON."
      },
      {
        role: "user",
        content: gptPrompt
      }
    ],
    temperature: 0.7,
    max_tokens: 1000
  });

  const gptResponse = completion.choices[0].message.content;
  const result = JSON.parse(gptResponse);
  
  return result.recommendations || [];
}

// Hugging Face recommendation function
async function getHuggingFaceRecommendations(prompt, coursesContext, maxCourses) {
  try {
    const hfPrompt = `
      You are a course recommendation assistant. Based on the user query: "${prompt}"

      Available courses: ${JSON.stringify(coursesContext)}

      Recommend the most relevant courses from the available list. Return ONLY a JSON array of course recommendation objects.

      Example format:
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
        max_new_tokens: 300,
        temperature: 0.3,
        return_full_text: false
      }
    });

    console.log('Hugging Face raw response:', response);

    const responseText = response.generated_text || '';
    let recommendations = [];

    // Try to extract JSON from response
    try {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Failed to parse Hugging Face response JSON:', parseError.message);
      throw new Error('Hugging Face response parsing failed');
    }

    return recommendations.slice(0, maxCourses);

  } catch (error) {
    console.log('Hugging Face API error:', error.message);
    throw new Error('Hugging Face recommendations failed');
  }
}

// Cohere recommendation function (updated for new SDK)
async function getCohereRecommendations(prompt, coursesContext, maxCourses) {
  if (!process.env.COHERE_API_KEY || !cohere) {
    throw new Error('Cohere API key not configured');
  }

  try {
    const coherePrompt = `
      You are a course recommendation assistant. Based on the user query: "${prompt}"

      Available courses: ${JSON.stringify(coursesContext)}

      Recommend the most relevant courses from the available list. Return ONLY a JSON array of course recommendation objects.

      Example format:
      [
        {"courseId": "course_id_1", "reason": "Explanation"},
        {"courseId": "course_id_2", "reason": "Explanation"}
      ]

      Maximum ${maxCourses} courses. Only recommend courses that exist in the available list.
    `;

    const response = await cohere.generate({
      model: 'command',
      prompt: coherePrompt,
      maxTokens: 300,
      temperature: 0.3,
      k: 0,
      p: 0.75,
      stopSequences: [],
      returnLikelihoods: 'NONE'
    });

    console.log('Cohere raw response:', response);

    const responseText = response.generations[0].text;
    let recommendations = [];

    // Try to extract JSON from response
    try {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.log('Failed to parse Cohere response JSON:', parseError.message);
      
      // Alternative: try to extract course IDs using regex
      const idRegex = /["']([a-f0-9]{24})["']/g;
      let match;
      const courseIds = [];
      
      while ((match = idRegex.exec(responseText)) !== null) {
        courseIds.push(match[1]);
      }
      
      if (courseIds.length > 0) {
        recommendations = courseIds.map(id => ({
          courseId: id,
          reason: "Recommended based on your query"
        }));
      } else {
        throw new Error('Could not extract recommendations from Cohere response');
      }
    }

    return recommendations.slice(0, maxCourses);

  } catch (error) {
    console.log('Cohere API error:', error.message);
    throw new Error('Cohere recommendations failed');
  }
}

// Enhanced keyword-based recommendation function
function getEnhancedKeywordRecommendations(prompt, allCourses, maxCourses) {
  const promptLower = prompt.toLowerCase();
  
  // Define keyword categories and their weights
  const keywordCategories = {
    programming: ['programming', 'code', 'developer', 'software', 'algorithm', 'script', 'api'],
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