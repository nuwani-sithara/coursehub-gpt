const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Public routes
router.post('/register', userController.register);
// router.post('/login', userController.login);

// Protected routes
router.get('/all-users', authMiddleware, userController.getAllUsers);
router.get('/role/:role', authMiddleware, userController.getUsersByRole);
router.get('/user/:id', authMiddleware, userController.getUserById);
router.put('/update-user/:id', authMiddleware, userController.updateUserById);
router.delete('/delete-user/:id', authMiddleware, userController.deleteUserById);

module.exports = router;
