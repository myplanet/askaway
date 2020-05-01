// set up ========================
var compass = require('compass');
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var passport = require('passport');
var io = require('socket.io');



// database =================
var db = require('./config/db')[process.env.NODE_ENV || 'development'];
var port = Number(process.env.PORT || 5000);
mongoose.connect(db.url);


// requires =================
require('./config/passport')(passport); // pass passport for configuration


// configuration =================
app.configure(function() {

  // Express.
  app.use(express.static(__dirname + '/public'));     // set the static files location /public/img will be /img for users
  app.use(express.logger('dev'));               // log every request to the console
  app.use(express.bodyParser());                // pull information from html in POST
  app.use(express.cookieParser());
  app.use(express.methodOverride());            // simulate DELETE and PUT
  app.use(express.session({ secret: 'imgonnaaskawayeverything', cookie: { httpOnly: false } })); // session secret
  
  // Compass.
  app.use(compass({ cwd: __dirname + '/public' }));

  // Passport.
  app.use(passport.initialize());
  app.use(passport.session()); // persistent login sessions
});



var https = require('https');
var http = require('http');

http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;

// routes ==================================================
require('./app/routes')(app, passport);

var socket = require('./app/socket.js');

// listen (start app with node server.js) ======================================
var io = require('socket.io').listen(app.listen(port));

io.configure(function () {
  io.set('transports');
});

io.sockets.on('connection', socket);

exports = module.exports = app;