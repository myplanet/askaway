var aaGeneral = angular.module('aaGeneral', []);

aaGeneral.controller('generalController', function($rootScope, $scope, $http, $q, auth, ui) {
  // Auth - User
  var promiseData = auth.authenticate();

  promiseData.then(function(data) {
     $rootScope.user = data;
     auth.setUser();
  });

  // Bring in the UI Services.
  $scope.flyoutSet = ui.flyoutSet;
  $scope.userDropSet = ui.userDropSet;
  $scope.userUpdate = ui.userUpdate;
  $scope.idExists = ui.idExists;
  $scope.loader = ui.loader;
});
