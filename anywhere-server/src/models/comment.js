const mongoose = require('mongoose');
const { Schema } = mongoose;

const Comment = new Schema({
  userId: String,
  userNickname: String,
  targetCanonicalUrl: String,
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
