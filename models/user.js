var mongoose = require('mongoose');

var schema =  new mongoose.Schema(
  {

    location: { type: String, default: 'Toronto' },

    google : {
      id: String,
      token: String,
      email: String,
      name: String,
      image: String
    }
  }
);

module.exports = mongoose.model('User', schema);