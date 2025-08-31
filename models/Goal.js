const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userEmail:{
    type: String,
    require:true
},
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  subject: {
    type: String,
    required: true,
    enum: ['Mathematics', 'Physics', 'Computer Science', 'English', 'Chemistry', 'Biology']
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  deadline: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  completed: {
    type: Boolean,
    default: false
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  }
}, {
  timestamps: true
});

// Index for faster queries
goalSchema.index({ user: 1, deadline: 1 });
goalSchema.index({ user: 1, completed: 1 });
goalSchema.index({ user: 1, priority: 1 });

module.exports = mongoose.model('Goal', goalSchema);