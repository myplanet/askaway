// load all the things we need
var GoogleStrategy = require('passport-google-oauth20').Strategy;

// load up the user model
var User = require('../models/user');

// load the auth variables
var configAuth = require('./auth')[process.env.NODE_ENV || 'development'];

module.exports = function(passport) {
  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // code for login (use('local-login', new LocalStategy))
  // code for signup (use('local-signup', new LocalStategy))
  // code for facebook (use('facebook', new FacebookStrategy))
  // code for twitter (use('twitter', new TwitterStrategy))

  // =========================================================================
  // GOOGLE ==================================================================
  // =========================================================================
  passport.use(
    new GoogleStrategy(
      {
        clientID: configAuth.googleAuth.clientID,
        clientSecret: configAuth.googleAuth.clientSecret,
        callbackURL: configAuth.googleAuth.callbackURL
      },
      function(token, refreshToken, profile, done) {
        // make the code asynchronous
        // User.findOne won't fire until we have all our data back from Google
        process.nextTick(function() {
          // See if there are restricted domains.
          if (configAuth.restrictedDomains) {
            // This user's domain.
            var userEmail = profile.emails[0].value;
            var userDomain = userEmail.replace(/.*@/, '');

            var stringifyRestricted = JSON.stringify(
              configAuth.restrictedDomains
            );

            if (stringifyRestricted.search(userDomain) <= 0) {
              return done(null, false, { message: 'Domain not permitted.' });
            }
          }

          // try to find the user based on their google id
          User.findOne({ 'google.id': profile.id }, function(err, user) {
            if (err) return done(err);

            // Get Photo
            var image = `${profile._json.picture}=s120`

            if (user) {
              // Update their profile.
              User.update(
                {
                  _id: user._id
                },
                {
                  $set: {
                    'google.name': profile.displayName,
                    'google.image': image
                  }
                },
                function(err, result) {
                  if (err) {
                    console.log('Error Updating: ' + err);
                  }
                  return done(null, user);
                }
              );
            } else {
              // if the user isnt in our database, create a new user
              var newUser = new User();

              // set all of the relevant information
              newUser.google.id = profile.id;
              newUser.google.token = token;
              newUser.google.name = profile.displayName;
              newUser.google.email = profile.emails[0].value; // pull the first email
              newUser.google.image = image;
              // save the user
              newUser.save(function(err) {
                if (err) throw err;

                return done(null, newUser);
              });
            }
          });
        });
      }
    )
  );
};
