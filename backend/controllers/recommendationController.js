const { OpenAI } = require('openai');
const { HfInference } = require('@huggingface/inference');
const Course = require('../models/course');
const Enrollment = require('../models/enrollment');

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Missing');
console.log('HF Key:', process.env.HUGGINGFACE_API_KEY ? 'Loaded' : 'Missing');

// Get personalized course recommendations with dual AI providers
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
        console.log('Both AI providers failed, using keyword matching:', hfError.message);
        
        // Final fallback: keyword matching
        recommendations = getKeywordBasedRecommendations(prompt, allCourses, maxCourses);
        aiProvider = 'Keyword Matching';
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

// Hugging Face recommendation function (fixed)
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

    // Call Hugging Face text generation
    const response = await hf.textGeneration({
      model: 'google/flan-t5-base',  // ✅ supported model
      inputs: hfPrompt,
      parameters: {
        max_new_tokens: 300,
        temperature: 0.3,
        return_full_text: false
      }
    });

    console.log('Hugging Face raw response:', response);

    // Extract JSON array safely
    const responseText = response.generated_text || '';
    let recommendations = [];

    // Try direct JSON parse
    try {
      const jsonMatch = responseText.match(/\[.*\]/s);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        // fallback: parse line by line in case model returns numbered list
        const lines = responseText.split('\n');
        lines.forEach(line => {
          try {
            const obj = JSON.parse(line.replace(/^\d+\.\s*/, ''));
            recommendations.push(obj);
          } catch (err) {
            // ignore non-JSON lines
          }
        });
      }
    } catch (parseError) {
      console.log('Failed to parse Hugging Face response JSON:', parseError.message);
    }

    // Limit to maxCourses
    return recommendations.slice(0, maxCourses);

  } catch (error) {
    console.log('Hugging Face API error:', error.message);
    throw new Error('Hugging Face recommendations failed');
  }
}

// Keyword-based fallback recommendation function
function getKeywordBasedRecommendations(prompt, allCourses, maxCourses) {
  const promptLower = prompt.toLowerCase();
  const keywordWeights = {
    'programming': 5, 'code': 4, 'developer': 4, 'software': 4,
    'web': 4, 'website': 3, 'html': 4, 'css': 4, 'javascript': 5,
    'python': 5, 'java': 4, 'react': 4, 'node': 4,
    'data': 4, 'science': 3, 'analysis': 3, 'machine': 4, 'ai': 4,
    'design': 3, 'ux': 3, 'ui': 3, 'graphic': 3,
    'business': 3, 'marketing': 3, 'finance': 3,
    'beginner': 2, 'intermediate': 2, 'advanced': 2
  };

  // Score courses based on keyword matching
  const scoredCourses = allCourses.map(course => {
    let score = 0;
    const courseText = `${course.title} ${course.description} ${course.category}`.toLowerCase();
    
    // Check for exact matches
    for (const [keyword, weight] of Object.entries(keywordWeights)) {
      if (promptLower.includes(keyword) && courseText.includes(keyword)) {
        score += weight;
      }
    }
    
    // Check for partial matches
    const promptWords = promptLower.split(/\s+/);
    for (const word of promptWords) {
      if (word.length > 3 && courseText.includes(word)) {
        score += 2;
      }
    }
    
    return { course, score };
  });

  // Sort by score and get top recommendations
  return scoredCourses
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCourses)
    .map((item, index) => ({
      courseId: item.course._id.toString(),
      reason: item.score > 0 ? `Matches your interest in ${prompt}` : 'Available course that might interest you'
    }));
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
        console.log('Both AI providers failed, using category-based matching:', hfError.message);
        
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