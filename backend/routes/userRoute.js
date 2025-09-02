const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/all-users', userController.getAllUsers);
router.get('/role/:role', userController.getUsersByRole);
router.get('/user/:id', userController.getUserById);
router.put('/update-user/:id', userController.updateUserById);
router.delete('/delete-user/:id', userController.deleteUserById);

module.exports = router;
