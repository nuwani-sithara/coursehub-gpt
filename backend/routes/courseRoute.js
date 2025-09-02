// routes/courseRoute.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middlewares/auth');

// Public routes
router.get('/all-courses', courseController.getAllCourses);
router.get('/course/:id', courseController.getCourseById);
router.get('/course-instructor/:instructorId', courseController.getCoursesByInstructor);
router.get('/course-student/:studentId', courseController.getCoursesByStudent);

// Protected routes
router.post('/create-course', authMiddleware, courseController.createCourse);
router.put('/update-course/:id', authMiddleware, courseController.updateCourse);
router.delete('/delete-course/:id', authMiddleware, courseController.deleteCourse);
// router.post('/enroll-course/:id', authMiddleware, courseController.enrollInCourse);

module.exports = router;