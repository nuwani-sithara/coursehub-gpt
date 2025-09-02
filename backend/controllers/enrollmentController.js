const Enrollment = require('../models/enrollment');
const Course = require('../models/course');
const User = require('../models/user');

// Enroll in a course
exports.enrollInCourse = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: req.params.id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: req.user.id,
      course: req.params.id,
      status: 'enrolled'
    });

    await enrollment.save();

    // Update course enrollment count
    await Course.findByIdAndUpdate(req.params.id, {
      $inc: { totalEnrollments: 1 }
    });

    // Populate course details for response
    await enrollment.populate('course', 'title instructor');

    res.status(200).json({
      message: 'Enrolled in course successfully',
      enrollment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get student's enrolled courses with status
exports.getStudentEnrollments = async (req, res) => {
  try {
    const studentId = req.user.role === 'admin' ? req.params.studentId : req.user.id;
    
    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        select: 'title description instructor category price duration level',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      })
      .sort({ enrollmentDate: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update enrollment status (progress, completion, etc.)
exports.updateEnrollment = async (req, res) => {
  try {
    const { status, progress } = req.body;
    const enrollmentId = req.params.id;

    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    // Check if student owns this enrollment or is admin/instructor
    if (req.user.role === 'student' && enrollment.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completionDate = new Date();
      }
    }
    if (progress !== undefined) {
      updateData.progress = progress;
    }
    updateData.lastAccessed = new Date();

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollmentId,
      updateData,
      { new: true, runValidators: true }
    ).populate('course', 'title instructor');

    res.status(200).json({
      message: 'Enrollment updated successfully',
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get course enrollments (for instructors to see their students)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify the requesting user is the course instructor or admin
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email username')
      .sort({ enrollmentDate: -1 });

    res.status(200).json(enrollments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};