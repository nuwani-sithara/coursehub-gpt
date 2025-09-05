const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/auth');
const { uploadImage, uploadFile } = require('../middlewares/upload');

// Public routes
router.get('/all-courses', courseController.getAllCourses);
router.get('/course/:id', courseController.getCourseById);
router.get('/course-instructor/:instructorId', courseController.getCoursesByInstructor);
router.get('/course-student/:studentId', courseController.getCoursesByStudent);

// Protected routes with file uploads
router.post('/create-course', 
  authMiddleware, 
  uploadImage.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 }
  ]),
  courseController.createCourse
);

router.put('/update-course/:id', 
  authMiddleware, 
  uploadImage.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 }
  ]),
  courseController.updateCourse
);

router.delete('/delete-course/:id', authMiddleware, courseController.deleteCourse);

// Attachment routes
router.post('/:id/attachments', 
  authMiddleware, 
  uploadFile.single('attachment'),
  courseController.addAttachment
);

router.delete('/:id/attachments/:attachmentId', 
  authMiddleware, 
  courseController.removeAttachment
);

module.exports = router;