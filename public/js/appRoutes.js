angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {

  $routeProvider
    // Rooms.
    .when('/rooms', {
      templateUrl: '/views/partials/rooms.html',
      controller: 'mainController',
    })

    // Room ended.
    .when('/room-end', {
      templateUrl: '/views/partials/end.html',
      controller: 'generalController',
    })

    // Inside Individual Room.
    .when('/room/:room_id', {
      templateUrl: '/views/partials/room.html',
      controller: 'roomController',
    })

    // Room custom.
    .when('/room/:setting/:room_id', {
      templateUrl: '/views/partials/room-export.html',
      controller: 'roomController',
    })

    // Main page.
    .when('/login', {
      templateUrl: '/views/partials/login.html',
    })

    // Error Pages
    .when('/404', {
      templateUrl: '/views/partials/404.html',
    })

    .otherwise({
      redirectTo: '/rooms'
    });

  $locationProvider.html5Mode(true);
}]);
