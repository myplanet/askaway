'use strict';

const dotenv = require('dotenv');
dotenv.config();

// SET UP
var async = require('async');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var compass = require('compass');
var connect = require('connect');
var express = require('express');
var io = require('socket.io');
var methodOverride = require('method-override');
var morgan = require('morgan');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');

var MongoStore = require('connect-mongo')(session);
var app = express();

// VARIABLES
var env = 'development';
var db_url = process.env.MONGODB_URI;

// DATABASE
mongoose.connect(db_url);

//SERVER
var port = Number(process.env.PORT || 5000);

// PASSPORT
require('./config/passport')(passport); // pass passport for configuration

// CONFIGURATIONS

// Redirects http -> https (for production + stage NODE_ENV only)
var sslRedirect = require('heroku-ssl-redirect')
app.use(sslRedirect(['production', 'stage']))

// Configuration: Express
app.use(express.static(__dirname + '/public')); // set the static files location /public/img will be /img for users

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(methodOverride());
app.use(
  session({
    secret: 'greatness awaits',
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 86400000 // One day
    },
    store: new MongoStore({ url: db_url })
  })
);

// Configuration: Compass
app.use(compass({ cwd: __dirname + '/public' }));

// Configuration: Passport
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

// SOCKETS
var https = require('https');
var http = require('http');

http.globalAgent.maxSockets = 100;
https.globalAgent.maxSockets = 100;

// ROUTES
var permissions = require('./config/permissions');
require('./app/permissions')(app, permissions);
require('./app/routes')(app, passport);
require('./app/login')(app, passport, __dirname);

var socket = require('./app/socket.js');

// LISTEN
// (node --watch app server.js)
var io = require('socket.io').listen(app.listen(port, () => console.log(`Started on port ${port}`)));

io.sockets.on('connection', socket);

exports = module.exports = app;
