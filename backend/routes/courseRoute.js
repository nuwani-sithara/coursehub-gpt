// routes/courseRoute.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/auth');
const { uploadImage, uploadFile, uploadAttachment } = require('../middlewares/upload');

// Public routes
router.get('/all-courses', courseController.getAllCourses);
router.get('/course/:id', courseController.getCourseById);
router.get('/course-instructor/:instructorId', courseController.getCoursesByInstructor);
router.get('/course-student/:studentId', courseController.getCoursesByStudent);

// Protected routes
router.post('/create-course', authMiddleware,
    uploadImage.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'featuredImage', maxCount: 1 }
    ]),
    courseController.createCourse
);
router.put('/update-course/:id', authMiddleware,
    uploadImage.fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'featuredImage', maxCount: 1 }
    ]),
    courseController.updateCourse
);
router.delete('/delete-course/:id', authMiddleware, courseController.deleteCourse);
// router.post('/enroll-course/:id', authMiddleware, courseController.enrollInCourse);

// Attachment routes
router.post('/:id/attachments', 
  authMiddleware, 
  (req, res, next) => {
    uploadAttachment(req, res, function(err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  courseController.addAttachment
);
router.delete('/:id/attachments/:attachmentId', authMiddleware, courseController.removeAttachment);

module.exports = router;