angular.module("roomDirectives", [])
  .directive("roomForm", function ($rootScope, $http, $location, socket) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: '/views/partials/_room_form.html',
      replace: true,
      controller: function($scope) {
        // Form defaults.
        $scope.roomInfo = {};
        $scope.formSubmitted = false;
        $scope.roomInfo.room_input = 1;
        $scope.roomInfo.room_notification = 'normal';
        $scope.roomInfo.room_voting = true;
        $scope.submitValue = 'Create';

        // Submitting form to create a room.
        $scope.saveRoom = function() {
          $scope.formSubmitted = true;
          $scope.formError = [];
          var valid = true;

          // Validation - Room name is not empty.
          if (!$scope.roomInfo.room_name) {
            $scope.formError.push({ message: 'Room name is required.'});
            valid = false;
          }

          if (valid) {
            $rootScope.loadingOn = true;

            $http.post('/api/rooms', $scope.roomInfo)
              .success(function(data) {
                // Clear form.
                $scope.roomInfo = {};
                $scope.formSubmitted = false;

                // Redirect to the new page.
                var newRoom = data;

                // Emit the message.
                socket.emit('rooms:change', { room_id: newRoom._id, status: 'new' });
                $location.path('/room/' + newRoom._id);
              })
              .error(function(data) {
                console.log('Error: ' + data);
              })
              .finally(function(data) {
                $rootScope.loadingOn = false;
                $rootScope.modalOff();
              });
          }
        };
      }
    };
  })

  .directive("roomFormEdit", function ($rootScope, $http, $location, $route, socket, ui) {
    return {
      restrict: 'E',
      scope: {
        room_id: '@roomId',
        room_name: '@roomName',
        room_desc: '@roomDesc',
        room_input: '@roomInput',
        room_notification: '@roomNotification',
        room_voting: '@roomVoting',
        room_date: '@roomDate',
        room_host: '@roomHost',
        room_host_image: '@roomHostImage',
        room_url: '@roomUrl'
      },
      templateUrl: '/views/partials/_room_form.html',
      replace: true,
      controller: function($scope) {
        // Form defaults.
        $scope.roomInfo = {};
        $scope.formSubmitted = false;
        $scope.roomInfo.room_input = 1;
        $scope.roomInfo.room_notification = 'normal';
        $scope.roomInfo.room_voting = 0;
        $scope.submitValue = 'Save Changes';
        $scope.roomInfoShow = true;

        // Load this room's settings.
        $scope.$watch('room_id', function(value) {
          $scope.roomInfo.room_id = value;
          $scope.roomInfo.room_name = $scope.room_name;
          $scope.roomInfo.room_desc = $scope.room_desc;
          $scope.roomInfo.room_input = $scope.room_input;
          $scope.roomInfo.room_notification = $scope.room_notification;
          if ($scope.room_voting == 'true') {
            $scope.roomInfo.room_voting = 1;
          }
        });

        // Submitting form to create a room.
        $scope.saveRoom = function() {
          $scope.formSubmitted = true;
          $scope.formError = [];
          var valid = true;

          // Validation - Room name is not empty.
          if (!$scope.roomInfo.room_name) {
            $scope.formError.push({ message: 'Room name is required.'});
            valid = false;
          }

          if (valid) {
            $rootScope.loadingOn = true;

            $http.post('/api/room/edit', $scope.roomInfo)
              .success(function(data) {
                $scope.formSubmitted = false;

                // Emit the message.
                socket.emit('rooms:change', { status: 'all' });
                socket.emit('room:settings', {room_id: $scope.roomInfo.room_id});

                $rootScope.getRoom();
              })
              .error(function(data) {
                console.log('Error: ' + data);
              })
              .finally(function(data) {
                $rootScope.loadingOn = false;
                $rootScope.modalOff();
              });
          }
        };
      }
    };
  })

  .directive("questionForm", function ($rootScope, $http, $location, $route, $timeout, socket, ui) {
    return {
      restrict: 'E',
      scope: {
        room_id: '@roomId',
        room_input: '@roomInput',
        question_edit: '@questionEdit',
        question_id: '@questionId',
        question_desc: '@questionDesc'
      },
      templateUrl: '/views/partials/_question_form.html',
      replace: true,
      controller: function($scope, ui) {
        // Cancel The Sidebar
        $scope.sideCancel = function() {
          // Reset Form.
          $scope.formSubmitted = false;
          $rootScope.questionSidebar(false);
        }

        // Is this an edit form
        $scope.$watch('question_id', function(value) {
          $scope.question_id = value;
        });

        $scope.$watch('question_desc', function(value) {
          $scope.questionInfo['desc'] = value;
        });

        // Ask question form.
        $scope.questionInfo = {};
        $scope.questionInfo.anonymous = false;
        $scope.formSubmitted = true;

        $scope.askSubmit = function(type) {
          $scope.formSubmitted = true;
          $scope.formError = [];
          var valid = true;

          $scope.questionInfo['room_id'] = $scope.room_id;

          if (type == 'verbal') {
            $scope.questionInfo['type'] = 0;
            $scope.questionInfo['desc'] = '';
          }
          else {
            $scope.questionInfo['type'] = 1;

            // Validation - A question is entered.
            if (!$scope.questionInfo.desc) {
              $scope.formError.push({ message: 'A valid question is required.'});
              valid = false;
            }
          }

          if (valid) {
            $rootScope.questionFormLoading = true;

            // Editing a previous question.
            if ($rootScope.questionEditForm) {
              $scope.questionInfo['question_id'] = $scope.question_id;
              var $question = angular.element(document.querySelector('#question-' + $scope.question_id));

              $http.post('/api/room/question/edit', $scope.questionInfo)
                .success(function(data) {
                  $scope.sideCancel();

                  // Get new questions.
                  $rootScope.getQuestions();

                  // Emit new question.
                  socket.emit('questions:change', {room_id: $scope.room_id, question_id: $scope.question_id, status: 'change'});
                })
                .error(function(data) {
                  console.log('Error: ' + data);
                })
                .finally(function(data) {
                  $rootScope.questionFormLoading = false;
                });
            }

            // Asking a new question.
            else {
              $http.post('/api/room/question', $scope.questionInfo)
                .success(function(data) {
                  // Clear form.
                  $scope.questionInfo = {
                    anonymous: false
                  };
                  $scope.sideCancel();

                  // Get new questions.
                  $rootScope.getQuestions();
                  $rootScope.getMyQuestions();

                  // The new question.
                  var newQuestionId = data[(data.length - 1)]._id;

                  // Emit new question.
                  socket.emit('questions:change', {room_id: $scope.room_id, question_id: newQuestionId, status: 'up'});
                })
                .error(function(data) {
                  console.log('Error: ' + data);
                })
                .finally(function(data) {
                  $rootScope.questionFormLoading = false;

                  // Scroll To New Question
                  $timeout(function() {
                    window.scrollTo(0, document.documentElement.scrollHeight + 200);
                  }, 1000);
                });
            }
          }
        };
      }
    };
  });
