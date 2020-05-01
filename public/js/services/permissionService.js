angular.module('appPermission', []).service('permService', function($rootScope, $http, $window, $q) {
  $rootScope.permissions = [];

  this.getPermissions = function() {
    var deferred = $q.defer();

    $http.get('/api/permissions/')
      .success(function(data) {
        $rootScope.permissions = data;
        deferred.resolve(data);
      });

    return deferred.promise;
  };

  this.checkPermission = function(host, permissionsName) {
    var valid = false;

    $rootScope.permissions.forEach(function(obj) {
      if (obj.checkId == host) {
        obj.permissions.forEach(function(perObj) {
          if (perObj.name == permissionsName) {
            valid = perObj.allow;
          }
        });
      }
    });

    return valid;
  }
});