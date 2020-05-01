//fill in the following information with your relevent credentials
//Replace URL with your own domain

module.exports = {
  development: {
    googleAuth: {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL
    }
  },
  production: {
    googleAuth: {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL
    }
    // restrictedDomains: {
    //   'websiteurl.com': 'websiteurl.com'
    // }
  }
};
