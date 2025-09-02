// controllers/userController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.register = async (req, res) => {
  const { name, email, username, password, role } = req.body;

  // Validate user input - check if all fields are provided
  if (!name || !email || !username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ 
      message: 'Username must be 4-20 characters long and can only contain letters, numbers, and underscores' 
    });
  }

  // Password validation
  if (password.length < 8) {
    return res.status(400).json({ 
      message: 'Password must be at least 8 characters long' 
    });
  }

  if (!/(?=.*[a-z])/.test(password)) {
    return res.status(400).json({ 
      message: 'Password must contain at least one lowercase letter' 
    });
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    return res.status(400).json({ 
      message: 'Password must contain at least one uppercase letter' 
    });
  }

  if (!/(?=.*\d)/.test(password)) {
    return res.status(400).json({ 
      message: 'Password must contain at least one number' 
    });
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return res.status(400).json({ 
      message: 'Password must contain at least one special character (@$!%*?&)' 
    });
  }

  // Check if user already exists by email
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Check if username is already taken
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({ message: 'Username is already taken' });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create new user
  const user = new User({
    name,
    email,
    username,
    password: hashedPassword,
    role
  });

  try {
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// user login
// exports.login = async (req, res) => {
//   const { username, password } = req.body;

//   // Validate user input
//   if (!username || !password) {
//     return res.status(400).json({ message: 'Username and password are required' });
//   }

//   try {
//     // Check if user exists
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     // Check password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     // Create JWT token
//     const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: '1h'
//     });

//     res.status(200).json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// get users by roles
exports.getUsersByRole = async (req, res) => {
  const { role } = req.params;

  try {
    const users = await User.find({ role });
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// get user by ID
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// update user by ID
exports.updateUserById = async (req, res) => {
  const { id } = req.params;
  const { name, email, username, role } = req.body;

  try {
    const user = await User.findByIdAndUpdate(id, { name, email, username, role }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// delete user by ID
exports.deleteUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
