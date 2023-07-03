const mongoose = require('mongoose');
const { Schema } = mongoose;

// targetUrl = targetFullUrl - urlFragment

const Comment = new Schema({
  userId: String,
  targetUrl: String,
  targetFullUrl: String,
  content: String,
  schemeAndHostAndPort: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Comment', Comment);
