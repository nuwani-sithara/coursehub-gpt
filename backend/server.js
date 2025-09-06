const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
require('dotenv').config();
require('./config/cloudinary');

const { initRequestCount } = require('./controllers/requestLogController'); 

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI);

const connection = mongoose.connection;
connection.once('open', async () => {
  console.log('MongoDB connected');

  // Load request counts from DB at startup
  await initRequestCount();
});

const userRoutes = require('./routes/userRoute.js');
app.use('/users', userRoutes);

const authRoutes = require('./routes/authRoute.js');
app.use('/auth', authRoutes);

const courseRoutes = require('./routes/courseRoute.js');
app.use('/courses', courseRoutes);

const enrollmentRoutes = require('./routes/enrollmentRoute.js');
app.use('/enrollments', enrollmentRoutes);

const recommendationRoutes = require('./routes/recommendationRoute.js');
app.use('/ai-recommendations', recommendationRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
