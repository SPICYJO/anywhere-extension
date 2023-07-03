// This class is for JWT serialization/deserialization
class UserModel {
  constructor(id, email, nickname) {
    this.id = id;
    this.email = email;
    this.nickname = nickname;
  }
}

module.exports = UserModel;
