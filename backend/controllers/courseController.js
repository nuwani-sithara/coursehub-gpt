const Course = require('../models/course');
const User = require('../models/user');
const { cloudinary } = require('../config/cloudinary');

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

    // Create course with optional image
    const courseData = {
      title,
      description,
      content,
      category,
      duration,
      level: level || 'Beginner',
      instructor: req.user.id
    };

    // Add thumbnail if uploaded
    if (req.files && req.files.thumbnail) {
      courseData.thumbnail = req.files.thumbnail[0].path;
    }

    // Add featured image if uploaded
    if (req.files && req.files.featuredImage) {
      courseData.featuredImage = req.files.featuredImage[0].path;
    }

    const course = new Course(courseData);
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
    let course = await Course.findById(req.params.id)
      .populate('instructor', 'name email username')
      .populate('students', 'name username');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Handle the typo during transition
    if (course.attachements && !course.attachments) {
      course.attachments = course.attachements;
      delete course.attachements;
      
      // Save the corrected document
      await Course.findByIdAndUpdate(
        req.params.id,
        { 
          $set: { attachments: course.attachments },
          $unset: { attachements: "" }
        }
      );
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

    const updateData = { ...req.body };

    // Handle thumbnail update
    if (req.files && req.files.thumbnail) {
      // Delete old thumbnail if exists
      if (course.thumbnail) {
        const publicId = course.thumbnail.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`coursehub/courses/images/${publicId}`);
      }
      updateData.thumbnail = req.files.thumbnail[0].path;
    }

    // Handle featured image update
    if (req.files && req.files.featuredImage) {
      // Delete old featured image if exists
      if (course.featuredImage) {
        const publicId = course.featuredImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`coursehub/courses/images/${publicId}`);
      }
      updateData.featuredImage = req.files.featuredImage[0].path;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
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

    // Delete images from Cloudinary
    if (course.thumbnail) {
      const thumbnailPublicId = course.thumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`coursehub/courses/images/${thumbnailPublicId}`);
    }

    if (course.featuredImage) {
      const featuredImagePublicId = course.featuredImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`coursehub/courses/images/${featuredImagePublicId}`);
    }

    // Delete attachments from Cloudinary
    if (course.attachments && course.attachments.length > 0) {
      for (const attachment of course.attachments) {
        const filePublicId = attachment.url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`coursehub/courses/files/${filePublicId}`, {
          resource_type: 'raw'
        });
      }
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

exports.addAttachment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the course instructor can add attachments' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const attachment = {
      filename: req.file.originalname,
      originalName: req.file.originalname,
      url: req.file.path,
      fileType: req.file.mimetype
    };

    // Ensure attachments array exists (handle the typo during transition)
    if (!course.attachments) {
      // Check if the old field name exists
      if (course.attachements) {
        course.attachments = course.attachements;
        delete course.attachements;
      } else {
        course.attachments = [];
      }
    }

    course.attachments.push(attachment);
    await course.save();

    res.status(200).json({ message: 'Attachment added successfully', attachment });
  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove attachment from course
exports.removeAttachment = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is the course instructor
    if (course.instructor.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the course instructor can remove attachments' });
    }

    const attachment = course.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete file from Cloudinary
    const filePublicId = attachment.url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(`coursehub/courses/files/${filePublicId}`, {
      resource_type: 'raw'
    });

    // Remove attachment from array
    course.attachments.pull(req.params.attachmentId);
    await course.save();

    res.status(200).json({ message: 'Attachment removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

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