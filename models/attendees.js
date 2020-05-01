var mongoose = require('mongoose');

var schema =  new mongoose.Schema(
  {
    email: String,
    name: String,
    image: String,
    location: String,

    room_id: String,
    // 1 for host, 2 for cohost
    host: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    status: { type: Boolean, default: 1 }
  }
);

module.exports = mongoose.model('Attendees', schema);