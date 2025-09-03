const Course = require('../models/course');
const User = require('../models/user');

// Create a new course (Instructor only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, content, category, duration, level } = req.body;
    
    // Check if user is an instructor
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Only instructors can create courses' });
    }

    // Validate required fields
    if (!title || !description || !content || !category) {
      return res.status(400).json({ message: 'Title, description, content, and category are required' });
    }

    // Create course
    const course = new Course({
      title,
      description,
      content,
      category,
      duration,
      level: level || 'beginner',
      instructor: req.user.id
    });

    await course.save();

    // Add course to instructor's createdCourses
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { createdCourses: course._id } }
    );

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name email username')
      .populate('students', 'name username');
    
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email username')
      .populate('students', 'name username');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update course (Instructor only)
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the course instructor can update this course' });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Course updated successfully', course: updatedCourse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete course (Instructor only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the course instructor can delete this course' });
    }

    await Course.findByIdAndDelete(req.params.id);

    // Remove course from instructor's createdCourses
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { createdCourses: req.params.id } }
    );

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enroll in a course (Student only)
// exports.enrollInCourse = async (req, res) => {
//   try {
//     // Check if user is a student
//     if (req.user.role !== 'student') {
//       return res.status(403).json({ message: 'Only students can enroll in courses' });
//     }

//     const course = await Course.findById(req.params.id);
    
//     if (!course) {
//       return res.status(404).json({ message: 'Course not found' });
//     }

//     // Check if already enrolled
//     if (course.students.includes(req.user.id)) {
//       return res.status(400).json({ message: 'Already enrolled in this course' });
//     }

//     // Add student to course
//     course.students.push(req.user.id);
//     await course.save();

//     // Add course to student's enrolledCourses
//     await User.findByIdAndUpdate(
//       req.user.id,
//       { $push: { enrolledCourses: req.params.id } }
//     );

//     res.status(200).json({ message: 'Enrolled in course successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// Get courses by instructor
exports.getCoursesByInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    if (!instructorId) {
      return res.status(400).json({ message: 'Instructor ID is required' });
    }

    const courses = await Course.find({ instructor: instructorId })
      .populate('instructor', 'name username')
      .populate('students', 'name username');

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get courses by student (courses a student is enrolled in)
exports.getCoursesByStudent = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const courses = await Course.find({ students: studentId })
      .populate('instructor', 'name email username')
      .populate('students', 'name username');
    
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};