const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'user_concern'
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  emailSent: {
    type: Boolean,
    default: false
  },
  emailError: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ status: 1 });
contactMessageSchema.index({ email: 1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
