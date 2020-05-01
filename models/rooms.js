var mongoose = require('mongoose');

var schema =  new mongoose.Schema(
  {
    name : String,
    desc: String,
    date: { type: Date, default: Date.now },
    // 1 = all, 2 = written only, 3 = verbal
    input: Number,
    notification: { type: String, default: 'normal' },
    voting: { type: Boolean, default: 0 },
    status: Boolean
  }
);

module.exports = mongoose.model('Rooms', schema);