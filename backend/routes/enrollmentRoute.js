const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const authMiddleware = require('../middlewares/auth');

// Student routes
router.get('/my-courses', authMiddleware, enrollmentController.getStudentEnrollments);
router.post('/enroll-course/:id', authMiddleware, enrollmentController.enrollInCourse);
router.put('/update-enrollment/:id', authMiddleware, enrollmentController.updateEnrollment);

// Instructor/admin routes
router.get('/course/:courseId', authMiddleware, enrollmentController.getCourseEnrollments);

module.exports = router;