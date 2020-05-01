angular.module('appSocket', [])
  .factory('socket', function ($rootScope) {
    var socket = io.connect();

    return {
      on: function (eventName, callback) {
        socket.on(eventName, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            callback.apply(socket, args);
          });
        });
      },
      emit: function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
          var args = arguments;
          $rootScope.$apply(function () {
            if (callback) {
              callback.apply(socket, args);
            }
          });
        })
      }
    };
  });

angular.module('fastClick', []).
  run(function() {
    FastClick.attach(document.body);
  });

angular.module('appAuth', [])
  .service('auth', function($rootScope, $http, $location, $q) {

    $rootScope.isSignedIn = false;

    this.authenticate = function() {
      var deferred = $q.defer();

      $http.post("/auth/google")
        .success(function(data) {
          deferred.resolve(data);
        })
        .error(function(data) {
          console.log('Error: ' + data);
        });

      return deferred.promise;
    };

    // User information.
    // Doing this like this for now incase we want to
    // integrate other login systems.
    this.setUser = function() {
      $rootScope.userEmail = $rootScope.user.google.email;
      $rootScope.userName = $rootScope.user.google.name;
      $rootScope.userImage = $rootScope.user.google.image;
      $rootScope.userLocation = $rootScope.user.location;

      // User Dropdown.
      $rootScope.formUserLocation = $rootScope.user.location;
    }
  });

angular.module('appUI', [])
  .service('ui', function($rootScope, $http, $document, $window, $swipe, $route, $timeout, socket) {
    $rootScope.isios = false;
    $rootScope.touch = false;

    this.isios = function() {
      var agent = navigator.userAgent.toLowerCase();
      if (agent.indexOf('iphone') !== -1 || agent.indexOf('ipad') !== -1) {
        $rootScope.isios = true;
      }
    };

    this.idExists = function (needle, haystack, haystackName) {
      if (haystack != undefined) {
        for(var i = 0; i < haystack.length; i++) {
          if (haystack[i][haystackName] != undefined) {
            if (needle == haystack[i][haystackName]) {
              return true;
            }
          }
        }
      }

      return false;
    };

    var touchY = 0;

    $document.on('touchstart', function(e) {
      touchY = e.targetTouches[0].clientY;
    });

    $document.on('touchmove', function(e) {
      var y = e.targetTouches[0].clientY;

      if (y > (touchY + 20) || y < (touchY - 20)) {
        angular.element(document.querySelector('html')).addClass('touch-move');
      }
    });

    $document.on('touchend', function(e) {
      $timeout(function() {
        angular.element(document.querySelector('html')).removeClass('touch-move');
      }, 500);
    });


    // Copy
    $rootScope.copyToClipboard = function(text) {
      window.prompt("Copy to clipboard: Ctrl+C, Enter", text);
    };

    // Sidebar
    $rootScope.sidebarOpen = function() {
      $rootScope.sidebarOn = true;
      $timeout(function() {
        $rootScope.sidebarIn = true;
      }, 50);
    };

    $rootScope.sidebarClose = function() {
      if ($rootScope.sidebarIn) {
        $rootScope.sidebarIn = false;
        $timeout(function() {
          $rootScope.sidebarOn = false;
        }, 500);
      }
    };

    // Modal
    $rootScope.modalOn = function(name) {
      $rootScope.modalOpen = true;

      var modal = angular.element(document.querySelector('#' + name));
      modal.addClass('active');

      $timeout(function() {
        modal.addClass('in');
      }, 50);
    };

    $rootScope.modalOff = function(name) {
      if (name === 'undefined') {
        name = false;
      }

      var modal = angular.element(document.querySelector('.modal.in'));

      if(modal.length) {
        if (name && name != modal.attr('id')) {
          return;
        }

        modal.removeClass('in');
        $timeout(function() {
          $rootScope.modalOpen = false;
          modal.removeClass('active');
        }, 325);
      }
    };

    $rootScope.$on( "$routeChangeStart", function(event, next, current) {
      $rootScope.modalOff();
    });
  });
