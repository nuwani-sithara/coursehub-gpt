const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  category: {
    type: String,
    required: true
  },
  duration: {
    type: String,
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: ''
  },
  featuredImage: {
    type: String,
    default: ''
  },
  attachments: [{
  filename: String,
  originalName: String,
  url: String,
  fileType: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
