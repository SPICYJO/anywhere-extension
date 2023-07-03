const mongoose = require('mongoose');
const { Schema } = mongoose;

const User = new Schema({
  // id: String,
  nickname: String,
  email: String,
  provider: String,
  providerAccessToken: String,
  providerId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
});

User.statics.findByEmail = function (email) {
  return this.findOne({ email }).exec();
};

module.exports = mongoose.model('User', User);
