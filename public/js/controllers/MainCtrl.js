var aaRooms = angular.module('aaRooms', ['appAuth']);

aaRooms.controller('mainController', function($rootScope, $scope, $http, $location, $timeout, $q, socket, auth, ui) {
  // Auth - User
  var promiseData = auth.authenticate();

  promiseData.then(function(data) {
     $rootScope.user = data;
     auth.setUser();
     $scope.getMyRooms();
  });

  // New resets.
  $scope.newRoom = '';
  $scope.outRoom = '';

  $scope.pageLoaded = false;


  // Getting all the rooms.
  $scope.getRooms = function(loader) {
    if (typeof loader === "undefined" || loader === null) {
      $rootScope.loadingOn = true;
    }

    if (loader) {
      $rootScope.loadingOn = true;
    }

    $http.get('/api/rooms')
      .success(function(data) {
        $scope.rooms = data;

        // Get the hosts
        $scope.getRoomHosts();
      })
      .error(function(data) {
        console.log('Error: ' + data);
      })
      .finally(function() {
        $rootScope.loadingOn = false;
        $timeout(function() {
          $scope.pageLoaded = true;
        }, 500);

      });
  };

  // Listening for room creation.
  socket.on('rooms:change', function (data) {
    if (data.status == 'new') {
      $scope.newRoom = data.room_id;
    }
    else if (data.status == 'out') {
      $scope.outRoom = data.room_id;
    }

    $timeout(function() {
      $scope.getRooms(false);
    }, 400);
  });

  $scope.getRoomHosts = function() {
    $http.get('/api/room/hosts')
      .success(function(data) {
        if (data.length) {
          $scope.hosts = data;
          $scope.pairRoomHosts();
        }
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };

  $scope.pairRoomHosts = function() {
    for (var i = 0; i < $scope.rooms.length; i++) {
      var thisRoomId = $scope.rooms[i]._id;

      for (var h = 0; h < $scope.hosts.length; h++) {
        if (thisRoomId == $scope.hosts[h]['room_id']) {
          $scope.rooms[i]['host_id'] = $scope.hosts[h]['_id'];
          $scope.rooms[i]['host_email'] = $scope.hosts[h]['email'];
          $scope.rooms[i]['host_name'] = $scope.hosts[h]['name'];
          $scope.rooms[i]['host_image'] = $scope.hosts[h]['image'];
          $scope.rooms[i]['host_location'] = $scope.hosts[h]['location'];
        }
      }
    }
  };

  // Get all Rooms I'm already in.
  $scope.getMyRooms = function() {
    $http.get('/api/my-rooms/')
      .success(function(data) {
        $scope.myRooms = data;
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }

  // Bring in the UI Services.
  ui.isios();
  $scope.idExists = ui.idExists;

  // Initiate
  $scope.getRooms();
});
