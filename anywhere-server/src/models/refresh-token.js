const mongoose = require('mongoose');
const { Schema } = mongoose;

const RefreshToken = new Schema({
  userId: String,
  tokenValue: String,
  expiresAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

RefreshToken.statics.findByTokenValue = function (tokenValue) {
  return this.findOne({ tokenValue }).exec();
};

RefreshToken.statics.deleteAllByUserId = function (userId) {
  return this.deleteMany({ userId }).exec();
};

module.exports = mongoose.model('RefreshToken', RefreshToken);
