const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
require('dotenv').config();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
});

const connection = mongoose.connection;
connection.once('open', () => {
  console.log('MongoDB connected');
});

const userRoutes = require('./routes/userRoute.js');
app.use('/users', userRoutes);

const authRoutes = require('./routes/authRoute.js');
app.use('/auth', authRoutes);

const courseRoutes = require('./routes/courseRoute.js');
app.use('/courses', courseRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
