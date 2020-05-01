var mongoose = require('mongoose');

var schema =  new mongoose.Schema(
  {
    email: String,
    name: String,
    image: String,

    room_id: String,
    // 0 = verbal, 1 = text.
    type: { type: Boolean, default: 0 },
    date: { type: Date, default: Date.now },
    // 0 = answered, 1 = unanswered.
    status: { type: Boolean, default: 1 },
    // 0 = not active, 1 = locked
    locked: { type: Boolean, default: 0},
    desc: { type: String, default: '' },
    anonymous: { type: Boolean, default: 0 },
    votes_count: { type: Number, default: 0 },
    votes: {
      email: String
    }
  }
);

module.exports = mongoose.model('Questions', schema);
