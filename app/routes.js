module.exports = function(app, passport) {

  // server routes ===========================================================
  // handle things like api calls
  // authentication routes

  var mdbRooms = require('../models/rooms');
  var mdbAttendees = require('../models/attendees');
  var mdbQuestions = require('../models/questions');
  var mdbPermissions = require('../models/permissions');
  var mdbUser = require('../models/user');

  // GLOBAL FUNCTIONS
  function roomPermissions(req, res, room_id, permName, callback) {
    mdbAttendees.find({
      room_id: room_id,
      email: req.user.google.email
    }).exec(function(err, result) {
      if (err) {
        res.send(err);
      }

      validatePermission(req, res, result[0].host, permName, callback)
    });
  }

  // USER =========================================================

  app.post('/api/user/update', function(req, res) {
    mdbUser.update({
      _id: req.user._id
    }, {$set: {
      location: req.body.location
    }}, function(err, user) {
      if (err) {
        res.send(err)
      }

      // Update all active rooms with this information.
      // @to-do use the promise library here.
      mdbAttendees.update({
        email: req.user.google.email
      }, {$set: {
        location: req.body.location
      }}, { multi: true } , function(err, attendees) {
        if (err) {
          res.send(err)
        }

        mdbQuestions.update({
          email: req.user.google.email
        }, {$set: {
          location: req.body.location
        }}, { multi: true } , function(err, questions) {
          if (err) {
            res.send(err)
          }

          res.json(questions);
        });
      });
    });
  });

  // ROOMS =========================================================
  app.get('/api/rooms', function(req, res) {

    mdbRooms.find({status: true}).sort({date: -1}).exec(function(err, rooms) {
      if (err) {
        res.send(err)
      }
      res.json(rooms);
    });
  });

  // Get Hosts.
  app.get('/api/room/hosts', function(req, res) {

    mdbAttendees.find({host: true, status: 1}).exec(function(err, hosts) {
      if (err) {
        res.send(err)
      }
      res.json(hosts);
    });
  });

  // Get my rooms
  app.get('/api/my-rooms/', function(req, res) {
    mdbAttendees.find({email: req.user.google.email, status: true}).exec(function(err, myRooms) {
      if (err) {
        res.send(err)
      }
      res.json(myRooms);
    });
  });

  // Create a Room
  app.post('/api/rooms', function(req, res) {
    var roomName = req.body.room_name;

    mdbRooms.create({
      name: roomName,
      desc: req.body.room_desc,
      input: req.body.room_input,
      notification: req.body.room_notification,
      voting: req.body.room_voting,
      status: 1
    }, function(err, room) {
      if (err) {
        res.send(err);
      }

      // Create the host as the first attendee.
      mdbRooms.find({name: roomName}).sort({date: -1}).exec(function(err, thisRoom) {
        var thisRoomId = thisRoom[0]._id;

        if (err) {
          res.send(err)
        }
        mdbAttendees.create({
          email: req.user.google.email,
          name: req.user.google.name,
          image: req.user.google.image,
          location: req.user.location,
          room_id: thisRoomId,
          host: 1
        });

        res.json(thisRoom[0]);
      });
    });

  });

  // INSIDE A ROOM =========================================================
  // Into a specific room
  app.get('/api/room/:room_id', function(req, res) {

    // use mongoose to get all room in the db
    mdbRooms.find({_id : req.params.room_id}).exec(function(err, room) {
      if (err) {
        res.send(err);
      }
      res.json(room);
    });
  });

  // Edit a room.
  app.post('/api/room/edit', function(req, res) {
    var callback = function() {
      mdbRooms.update({
        _id: req.body.room_id
      }, {$set: {
        name: req.body.room_name,
        desc: req.body.room_desc,
        input: req.body.room_input,
        notification: req.body.room_notification,
        voting: req.body.room_voting,
      }}, function(err, result) {
        if (err) {
          res.send(err)
        }

        res.json(result);
      });
    };

    roomPermissions(req, res, req.body.room_id, 'edit-room', callback);

  });

  // Join a room.
  app.post('/api/room/join', function(req, res) {

    // Check if they've already joined.
    mdbAttendees.find({room_id: req.body.room_id, email: req.user.google.email}).exec(function(err, attendee) {
      if (!attendee.length) {
        mdbAttendees.create({
          email: req.user.google.email,
          name: req.user.google.name,
          image: req.user.google.image,
          location: req.user.location,
          room_id: req.body.room_id,
        }, function(err, attendee) {
          if (err) {
            res.send(err);
          }

          res.json(attendee);
        });
      }
      else {
        res.json({
          _id: attendee[0]._id,
          host: attendee[0].host,
          status: 'rejoin'
        });
      }
    });
  });

  // End a room.
  app.post('/api/room/end', function(req, res) {
    var callback = function() {
      mdbRooms.update({
        _id: req.body.room_id
      }, {$set: { status: 0 }}, function(err, result) {
        if (err) {
          res.send(err)
        }

        res.json(result);
      });
    };

    roomPermissions(req, res, req.body.room_id, 'end-room', callback);
  });

  // Leave a room.
  app.post('/api/room/leave', function(req, res) {
    mdbAttendees.remove({
      email: req.user.google.email,
      room_id: req.body.room_id
    }, function(err, result) {
      if (err) {
        res.send(err)
      }

      res.json(result);
    });
  });

  // Get Attendees.
  app.get('/api/room/attendees/:room_id/:get_host', function(req, res) {

    // Get Host
    if (req.params.get_host != 0 ) {
      mdbAttendees.find({room_id: req.params.room_id, host: req.params.get_host }).exec(function(err, host) {
        if (err) {
          res.send(err)
        }
        res.json(host);
      });
    }
    else {
      mdbAttendees.find({room_id: req.params.room_id, host: false, status: true}).sort({date: 1}).exec(function(err, attendees) {
        if (err) {
          res.send(err)
        }
        res.json(attendees);
      });
    }
  });

  // Set Cohost
  app.post('/api/room/cohost', function(req, res) {
    var hostStatus = req.body.set_state;

    var callback = function() {
      mdbAttendees.update({
        _id: req.body.attendee_id
      }, {$set: { host: hostStatus }}, function(err, result) {
        if (err) {
          res.send(err)
        }

        res.json(result);
      });
    };

    roomPermissions(req, res, req.body.room_id, 'mod-cohost', callback);
  });

  // Get Questions.
  app.get('/api/room/questions/:room_id/:question_status', function(req, res) {

    var questionQuery = {
      room_id: req.params.room_id
    }

    // Query.
    if (req.params.question_status == 'true') {
      questionQuery.status = true;
    }

    mdbQuestions.find(questionQuery).sort({
      locked: -1,
      votes_count: -1,
      date: 1
    }).exec(function(err, questions) {
      if (err) {
        res.send(err)
      }
      res.json(questions);
    });
  });

  // Get My Questions.
  app.get('/api/room/my-questions/:room_id', function(req, res) {

    mdbQuestions.find({room_id: req.params.room_id, email: req.user.google.email, status: true}).exec(function(err, questions) {
      if (err) {
        res.send(err)
      }
      res.json(questions);
    });
  });

  // Get a single question.
  app.get('/api/room/question/:question_id', function(req, res) {

    mdbQuestions.find({
      _id: req.params.question_id,
      email: req.user.google.email
    }).exec(function(err, question) {
      if (err) {
        res.send(err)
      }
      res.json(question);
    });
  });

  // Ask a Question
  app.post('/api/room/question', function(req, res) {
    var locked = 0;

    // Check if this is the first question
    mdbQuestions.find({
      room_id: req.body.room_id
    }).exec(function(err, questions) {
      if (!questions.length) {
        createQuestion(req, 1);
      }
      else {
        createQuestion(req, 0);
      }
    });

    var isAnonymous = req.body.anonymous === '1';
    var email = isAnonymous ? 'x@x.com' : req.user.google.email;
    var name = isAnonymous ? 'Anonymous' : req.user.google.name;
    var image = isAnonymous ? null : req.user.google.image;

    function createQuestion(req, locked) {
      mdbQuestions.create({
        email: email,
        name: name,
        image: image,
        room_id: req.body.room_id,
        type: req.body.type,
        locked: locked,
        desc: req.body.desc,
        anonymous: req.body.anonymous
      }, function(err, question) {
        if (err) {
          res.send(err);
        }

        // Return a new set of questions.
        mdbQuestions.find({room_id: req.body.room_id, status: true}).sort({date: 1}).exec(function(err, questions) {
          if (err) {
            res.send(err)
          }
          res.json(questions);
        });
      });
    }
  });

  // Edit a Question
  app.post('/api/room/question/edit', function(req, res) {
    var isAnonymous = req.body.anonymous === '1';
    var email = isAnonymous ? 'x@x.com' : req.user.google.email;
    var name = isAnonymous ? 'Anonymous' : req.user.google.name;
    var image = isAnonymous ? null : req.user.google.image;

    mdbQuestions.update({
      _id: req.body.question_id,
      email: req.user.google.email,
      status: 1
    }, {$set: {
      email: email,
      name: name,
      image: image,
      type: req.body.type,
      desc: req.body.desc,
      anonymous: req.body.anonymous
    }}, function(err, question) {
      if (err) {
        res.send(err);
      }

      res.json(question);
    });
  });

  // Cancel a Question
  app.post('/api/room/question/cancel', function(req, res) {
    mdbQuestions.remove({
      _id: req.body.question_id,
      email: req.user.google.email
    }, function(err, questions) {
      if (err) {
        res.send(err);
      }
      res.json(questions);
    });
  });

  // Vote a Question
  app.post('/api/room/question/vote/up', function(req, res) {
    mdbQuestions.update({
      _id: req.body.question_id,
      email: { $ne: req.user.google.email }
    }, {$inc: {
      votes_count: 1
    }, $addToSet: {
      votes: {
        email: req.user.google.email
      }
    }}, function(err, question) {
      if (err) {
        res.send(err);
      }

      res.json(question);
    });
  });

  app.post('/api/room/question/vote/down', function(req, res) {
    mdbQuestions.update({
      _id: req.body.question_id
    }, {$inc: {
      votes_count: -1
    }, $pull: {
      votes: {
        email: req.user.google.email
      }
    }}, function(err, question) {
      if (err) {
        res.send(err);
      }

      res.json(question);
    });
  });

  // Complete a Question
  app.post('/api/room/question-complete', function(req, res) {
    var callback = function() {
      mdbQuestions.update({
        _id: req.body.question_id,
        status: 1,
      }, {$set: {
        status: 0
      }}, function(err, questions) {
        if (err) {
            res.send(err)
          }
          res.json(questions);
      });
    };

    roomPermissions(req, res, req.body.room_id, 'answer-question', callback);
  });

  // Active Question
  app.route('/api/room/question-active')
    .post(function(req, res) {
      mdbQuestions.findOneAndUpdate(
        { _id: req.body.question_id }, // Query
        { $set: {locked: 1} }, // Update
        { sort: { votes_count: -1, date: 1 } } // Options
      , function(err, questions) {
          if (err) {
            res.status(500);
          }

          res.status(200).json({status:"ok"});
        }
      );
    });
};


function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.session.lastPage = (req.originalUrl != '/login') ? req.originalUrl : '/rooms';
  res.redirect('/login');
}
