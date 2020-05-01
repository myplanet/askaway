module.exports = function(app, passport, __dirname) {
  // LOGINS =========================================================
  app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/public/views/index.html');
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.clearCookie('user');
    res.redirect('/');
  });

  app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.post('/auth/google', function(req, res) {
    if (req.isAuthenticated()) {
      res.status(200).json(req.user);
      //res.json(req.user);
    } else {
      res.send(530, { error: 'Invalid user.' });
    }
  });

  app.get('/logged-in', function(req, res) {
    var reTo = req.session.lastPage ? req.session.lastPage : '/rooms';

    res.redirect(reTo);
  });

  // the callback after google has authenticated the user
  app.get(
    '/oauth2callback',
    passport.authenticate('google', {
      successRedirect: '/logged-in',
      failureRedirect: '/'
    })
  );

  // frontend routes =========================================================
  // Authenticate all paths.

  app.get('/*', isLoggedIn, function(req, res) {
    res.sendFile(__dirname + '/public/views/index.html');
  });

  app.get('*', function(req, res) {
    res.sendFile(__dirname + '/public/views/index.html');
  });
};

// fill it with your own spoof user information
function spoofUser(req) {
  req.user = {
    location: 'Toronto',
    google: {
      id: '123',
      email: 'anna.m@myplanet.com',
      name: 'Fake User'
    }
  };

  return req;
}

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  var url = req.originalUrl;
  req.session.lastPage = url.indexOf('room') >= 0 ? url : '/rooms';
  res.redirect('/login');
}
