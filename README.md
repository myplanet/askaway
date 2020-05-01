# Askaway

Askaway is a tool that facilitates...
You can share the link to the room externally to allow individuals to join the discussion.

Room Settings:
- allow voting
- allow all questions
- allow written questions only
- allow verbal questions only

There is also an option to export the questions afterwards.

## Set up your own Askaway
These steps will provide detailed info for configuring an instance of Askaway that you can run on a custom machine like a development environment, or inside Heroku. The application is configured with environment variables making it flexible to deploy in many places, though testing has primarily been done on local development environments and via deployment with Heroku.

### Prerequisites
In order to setup and deploy your Askaway instance to Heroku, you'll need:
* Node.js and NPM and Git installed
* a free Heroku account
* the Heroku CLI

### Setting up a Local Environment
It is recommended that you setup a local instance of Askaway before deploying to other sources like Heroku.

To setup an Askaway instance in a local environment:
* Fork the GitHub repo and clone it to your machine
* Run `npm install` from the root of the project to install dependencies
* Create a `.env` file in the project root for specifying environment variables specific to your instance
* Add a line to the `.env` file specifying the port you want the application to run on
  * Example: `PORT=3000`
* For other environment variables mentioned below, these can be added on additional lines in the `.env` file. The list of required variables are:
  * `PORT`
  * `MONGODB_URI`
  * `CALLBACK_URL`
  * `CLIENT_ID`
  * `CLIENT_SECRET`

### Set up MongoDB
Askaway deployed to Heroku is designed to work without configuration when using the `mLab MongoDB` Add-on. If deploying to Heroku, the below steps are not necessary unless you'd like to use a custom MongoDB instance.

Configure Mongo instance with your Heroku app by going to your Heroku dashboard in the 'overview' tab.
* Click configure Add ons.
* Search for mLabs in 'Add-ons'. (You may have to add a credit card for a free account)
* Start your mongo db instance

Alterntively, to setup Mongo for your local environment or in a custom server:
* Install MongoDB in your environment, or in an accessible location for your environment to access
* Use MongoDB Compass or other means to obtain your DB connection string
  * More info on how your connection string can be found: https://docs.mlab.com/connecting/#connect-string
  * Save this for an environment variable `MONGODB_URI`

### Set up Google Cloud OAuth
Askaway currently supports Google SSO through OAuth which works nicely for teams that use GSuite. Alternatively, access to the application can be configured to allow anyone with a Google account to access the app.
* Note: Be mindful with allowing logins from all Google accounts in deciding where to host your instance of Askaway, especially if users will be adding questions containing internal company or personal information.

#### Create a Google Cloud Project
* Visit the Google Cloud Console at `https://console.cloud.google.com`
* Press `Select a project` in the header, and `NEW PROJECT` in the top right of the popup modal
* Give your project a name - this project will manage your instance of AskAway's Google Account login for users

#### OAuth Consent Screen
* Once the project is created, open the hamburger menu and open `APIs & Services` -> `OAuth consent screen`
  * If prompted to select a project, select the project you just created
* Select the User Type you want to use in your AskAway instance, then hit `Create`
  * For organizations with GSuite, specifying `Internal` will limit access to your app to those in your organization
* Specify an `Application name` in the corresponding box, then scroll to the bottom and hit `Save`

#### Create Credentials
* Switch to the `Credentials` tab and hit `CREATE CREDENTIALS` near the top, select `OAuth client ID`
* Select the Application type `Web application`. Specify a name for the client ID, then hit `Create`
* Open the Client ID that you just created
* Specify the `URIs` value under `Authorized JavaScript origins` as the URI of where you will be running the application
  * For localhost, this would look like `http://localhost:3000` if you wanted to run it on port 3000
* Specify the `URIs` value under `Authoried redirect URIs` as the callback URI for your app once the user is authenticated
  * For localhost, this would look like `http://localhost:3000/oauth2callback`
  * Save the value for an environment variable `CALLBACK_URL`
* Record the `Client ID` and `Client secret` values for environment variables `CLIENT_ID` and `CLIENT_SECRET`

### Run the Askaway instance
Once the environment is setup with the variables obtained from the above process, the project can be installed and run with:
* `npm install`
* `node server.js` or `nodemon server.js`

### Deploy your Askaway Instance to Heroku
#### Configuring your Google Sign in

1. Go to your Heroku dashboard.
2. Navigate to the settings tab.
3. Find 'Config Vars' and add the credentials for CLIENT_ID, CLIENT_SECRET and CALLBACK_URL.

#### Authorize Domain and Callback URL

Navigate to your Google cloud, where you created your app.

1. Navigate to the credentials tab.
2. Add your domain to Authorized JavaScript origins.
3. Add your callback url to Authorized redirect URIs.

#### Deploy the app
Download and install the Heroku CLI here: https://devcenter.heroku.com/articles/heroku-cli

If you haven't already, log in to your Heroku account and follow the prompts to create a new SSH public key.
```
$ heroku login
```

Clone the Askaway git repository (either one that you forked, or directly from this repo)

Add your remote for the a Heroku app you created.
```
$ heroku git:remote -a YOUR-APP-NAME
```

After making changes, commit and push your changes to Heroku
```
$ git add .
$ git commit -am "make it better"
$ git push heroku master
```

For further details please visit the Heroku documentation here: https://devcenter.heroku.com/articles/deploying-nodejs#prerequisites

#### Notes about HTTPS/SSL
Askaway is configured to automatically redirect requests it receives with `http` to `https` if the `NODE_ENV` is set 
to either `stage`, `production` or is left unset. Heroku provides a certificate for your app, but, if deploying 
elsewhere you will need to provide a certificate to use `https`. While it is recommended you use SSL, you can disable 
the redirect by removing the `heroku-ssl-redirect` package usage in the primary node server file.

While Heroku does provide support for `https` on their provided domains, they currently require at least a Hobby dyno 
package to provide `https` encryption through a custom domain.

## Upload your logo
To upload your company logo, please go to 'images/company/' and replace the logo-sample.svg file with your own company logo.
