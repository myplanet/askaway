angular.module("generalDirectives", [])
  .directive("appHeader", function ($rootScope, $http, $location, socket, ui) {
    return {
      restrict: 'E',
      scope: {
        userName: '@userName',
        userImage: '@userImage',
        heading: '@heading',
        headingBot: '@headingBot'
      },
      templateUrl: '/views/partials/_header.html',
      replace: true,
      controller: function($scope, ui) {
      }
    };
  });