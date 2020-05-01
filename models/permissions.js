var mongoose = require('mongoose');

var schema =  new mongoose.Schema(
  {
    name: String,
    check_id: String,
    permission_name: String,
    permission_allow: { type: Boolean, default: 0 }
  }
);

module.exports = mongoose.model('permission', schema);