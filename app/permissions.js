module.exports = function(app, permissions) {
  var mdbPermissions = require('../models/permissions');

  // Store in DB for now: not sure if I need it.
  app.get('/permissions', function() {
    permissions.forEach(function(obj) {
      obj.permissions.forEach(function(perObj) {
        mdbPermissions.update(
          {
            name: obj.name,
            check_id: obj.checkId,
            permission_name: perObj.name
          },
          {
            $set: {
              permission_allow: perObj.allow
            }
          },
          {
            upsert: true
          },
          function(err, result) {
            console.log('Permission Updated');
          }
        );
      });
    });
  });

  app.get('/api/permissions', function(req, res) {
    res.status(200).json(permissions);
  });

  // Permission Functions
  global.checkPermission = function(checkId, permName) {
    var valid = false;

    permissions.forEach(function(obj) {
      if (obj.checkId == checkId) {
        obj.permissions.forEach(function(perObj) {
          if (perObj.name == permName) {
            valid = perObj.allow;
          }
        });
      }
    });

    return valid;
  };

  global.validatePermission = function (req, res, checkId, permName, callback) {
    if (checkPermission(checkId, permName)) {
      callback();
    }
    else {
      console.log('Invalid Permissions');
      res.status(500);
    }
  }
}
