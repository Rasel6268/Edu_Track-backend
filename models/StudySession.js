const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userEmail:{
    type: String,
    require:true
},
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Physics', 'Computer Science', 'English', 'Chemistry', 'Biology']
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    min: 0.5,
    max: 8
  },
  completed: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  }
}, {
  timestamps: true
});

// Index for faster queries
studySessionSchema.index({ user: 1, date: 1 });
studySessionSchema.index({ user: 1, completed: 1 });
studySessionSchema.index({ user: 1, subject: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);