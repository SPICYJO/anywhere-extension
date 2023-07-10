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

Comment.statics.findByTargetCanonicalUrl = function (
  targetCanonicalUrl,
  page = 0,
  size = 10,
) {
  const skipCount = page * size;

  return this.find({ targetCanonicalUrl })
    .sort({ createdAt: -1 })
    .skip(skipCount)
    .limit(size)
    .exec();
};

Comment.statics.countByTargetCanonicalUrl = function (targetCanonicalUrl) {
  return this.countDocuments({ targetCanonicalUrl }).exec();
};

module.exports = mongoose.model('Comment', Comment);
