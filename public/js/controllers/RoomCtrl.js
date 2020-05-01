var aaRoom = angular.module('aaRoom', ['appAuth']);

aaRoom.controller('roomController', function($rootScope, $scope, $http, $routeParams, $location, $timeout, $q, socket, auth, ui, permService, ModalService) {
  // Auth - User
  var promiseData = auth.authenticate();

  promiseData.then(function(data) {
    $rootScope.user = data;
    auth.setUser();
    $scope.joinRoom();
    $scope.getHost();
    $rootScope.getMyQuestions();
  });

  // Presets.
  $scope.isHost = false;
  $scope.cancelQuestionId = false;  // Delete a question
  $scope.editQuestionId = false;    // Editing a question
  $scope.editQuestionDesc = false;  // Grabbing description for edit

  // New resets.
  $scope.attendeesChange = '';
  $scope.newAttendee = '';
  $scope.questionsChange = '';
  $scope.newQuestion = '';
  $scope.outQuestion = '';

  // Room Variables
  $scope.attendeeId = '';
  $scope.attendeeCheckId = '';
  $scope.pageLoaded = false;

  // Timer
  var roomLoading = false;


  // Joins the room if they haven't already.
  $scope.joinRoom = function() {
    var joinRoom = {};
    joinRoom['room_id'] = $routeParams.room_id;

    if ($rootScope.userEmail != '') {
      $http.post('/api/room/join', joinRoom)
        .success(function(data) {
          if (data.status !== 'rejoin') {
            var emitData = {};
            emitData['room_id'] = $routeParams.room_id;
            emitData['user_email'] = $rootScope.userEmail;
            emitData['status'] = 'up';

            // Emit new attendees.
            socket.emit('attendees:change', emitData);
          }

          $scope.attendeeId = data._id;
          $scope.attendeeCheckId = data.host;
          $scope.getAttendees();
        });
    }
  };


  // ROOM
  // *****************************************

  $rootScope.getRoom = function(room_id) {
    if (roomLoading) {
      return;
    }

    $rootScope.loadingOn = true;

    if (typeof room_id === "undefined" || room_id === null) {
      room_id = $routeParams.room_id;
    }

    $http.get('/api/room/' + room_id)
      .success(function(data) {
        if (!data.length || !data[0].status) {
          $location.path('/room-end');
        }

        $scope.room = data[0];
        roomLoading = true;

        // Readable outputs.
        $scope.room.notificationOutput = '';
        switch ($scope.room.notification) {
          case 'aggressive':
            $scope.room.notificationOutput = 'Every 30 seconds';
            break;
          case 'normal':
            $scope.room.notificationOutput = 'Every minute';
            break;
          case 'passive':
            $scope.room.notificationOutput = 'Every 2 minutes';
            break;
          case 'dormant':
            $scope.room.notificationOutput = 'Every 5 minutes';
            break;
          case 'none':
            $scope.room.notificationOutput = 'Never';
            break;
        }

        $scope.room.inputOutput = '';
        switch ($scope.room.input) {
          case 1:
            $scope.room.inputOutput = 'All questions';
            break;
          case 2:
            $scope.room.inputOutput = 'Written only';
            break;
          case 3:
            $scope.room.inputOutput = 'Verbal only';
            break;
        }

        $scope.room.votingOutput = '';
        switch ($scope.room.voting) {
          case false:
            $scope.room.votingOutput = 'No';
            break;
          case true:
            $scope.room.votingOutput = 'Yes';
            break;
          default:
            $scope.room.votingOutput = 'No';
        }

        $scope.url = $location.absUrl().split('?')[0];
      })
      .error(function(data) {
        console.log('Error: ' + data);
        $location.path('/room-end');
      })
      .finally(function() {
        $rootScope.loadingOn = false;
        $scope.pageLoaded = true;
        roomLoading = false;
      });
  };

  socket.on('room:settings', function (data) {
    if (data.room_id == $routeParams.room_id) {
      $timeout(function() {
        $rootScope.getRoom(data.room_id);
      }, 550);
    }
  });

  // Edit the room.
  $scope.editRoom = function() {
    $rootScope.roomDropOn = false;
    ui.sideCancel(false);
    ui.sideOpen('editRoomForm');
  };

  $scope.roomLeave = function(endRoom) {
    if (endRoom == undefined) {
      endRoom = false;
    }

    var leaveRoom = {};
    leaveRoom['room_id'] = $routeParams.room_id;

    if (endRoom && $scope.isHost) {
      $http.post('/api/room/end', leaveRoom)
        .success(function(data) {
          // Emit attendees change.
          socket.emit('rooms:change', { status: 'out' });
          socket.emit('room:end', {room_id: $routeParams.room_id, status: 'out' });

          $scope.roomLeave(false);
        });
    }
    else {
      $http.post('/api/room/leave', leaveRoom)
        .success(function(data) {
          // Emit attendees change.
          socket.emit('attendees:change', {room_id: $routeParams.room_id, status: 'down'});

          $location.path('/rooms');
        });
    }
  };

  socket.on('room:end', function (data) {
    // Check if that's this room.
    if (data.room_id == $routeParams.room_id) {
      $location.path('/room-end');
    }
  });


  // HOST AND ATTENDEES
  // *****************************************

  $scope.getHost = function() {
    $http.get('/api/room/attendees/' + $routeParams.room_id + '/1')
      .success(function(data) {
        if (data.length) {
          $scope.theHost = data[0];

          // Check if that's us.
          if ($scope.theHost.email == $rootScope.userEmail) {
            $scope.isHost = true;
          }
        }
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }

  // Getting the attendees.
  $scope.getAttendees = function() {
    $scope.cohosts = [];
    $scope.attendees = [];

    // Cohosts
    $http.get('/api/room/attendees/' + $routeParams.room_id + '/2')
      .success(function(data) {
        if (data.length) {
          $scope.cohosts = data;
        }
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });

    // Attendees
    $http.get('/api/room/attendees/' + $routeParams.room_id + '/0')
      .success(function(data) {
        $scope.attendees = data;
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  }
  $scope.getAttendees();

  // Listening for new attendees.
  socket.on('attendees:change', function (data) {
    // Check if that's this room.
    if (data.room_id == $routeParams.room_id) {
      // New Attendee
      if (data.user_email && data.status) {
        $scope.newAttendee = data.user_email;
        $scope.attendeesChange = data.status;
      }

      // Cohost Change
      if (data.status == 'cohost') {
        // If this is me
        console.log(data.attendee_id + ' - ' + $scope.attendeeId);
        if (data.attendee_id == $scope.attendeeId) {
          $scope.attendeeCheckId = data.check_id;
        }
      }

      $scope.getAttendees();

      $timeout(function() {
        $scope.attendeesChange = '';
      }, 550);
    }
    else if (data.room_id == 'all') {;
      $scope.getHost();
      $scope.getAttendees();
    }
  });

  $scope.setCohost = function(attendeeId, state) {
    $rootScope.sidebarLoadingOn = true;

    $http.post('/api/room/cohost', {
      room_id: $routeParams.room_id,
      attendee_id: attendeeId,
      set_state: state
    })
    .success(function(data) {
      $scope.getAttendees();

      // Emit change
      var emitData = {};
      emitData['room_id'] = $routeParams.room_id;
      emitData['attendee_id'] = attendeeId;
      emitData['check_id'] = state;
      emitData['status'] = 'cohost';

      // Emit new attendees.
      socket.emit('attendees:change', emitData);
    })
    .finally(function() {
      $rootScope.sidebarLoadingOn = false;
    });
  }


  // QUESTIONS
  // *****************************************

  $rootScope.getQuestions = function(voting) {
    var questionStatus = 'true';

    if ($routeParams.setting == 'export') {
      questionStatus = 'all';
    }

    $http.get('/api/room/questions/' + $routeParams.room_id + '/' + questionStatus)
      .success(function(data) {
        $scope.questions = data;
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };
  $rootScope.getQuestions();

  // Listening for new questions.
  socket.on('questions:change', function (data) {
    // Check if that's this room.
    if (data.room_id == $routeParams.room_id) {
      $scope.questionsChange = data.status;

      if ($scope.questionsChange == 'up') {
        $scope.newQuestion = data.question_id;
      }
      else if ($scope.questionsChange == 'down') {
        $scope.outQuestion = data.question_id;
      }

      $timeout(function() {
        $scope.questionsChange = '';
        $rootScope.getQuestions();
      }, 550);
    }
    else if (data.room_id == 'all') {;
      $rootScope.getQuestions();
    }
  });

  // Get all of my questions.
  $rootScope.getMyQuestions = function() {
    $http.get('/api/room/my-questions/' + $routeParams.room_id)
      .success(function(data) {
        $scope.myQuestions = data;
      })
      .error(function(data) {
        console.log('Error: ' + data);
      });
  };

  // Ask question form.
  $scope.questionInfo = {};

  // These functions are for the users handling questions.
  $scope.askQuestion = function() {
    // This room only handles verbal questions.
    // So we'll skip the flyout and submit this right away.
    if ($scope.room.input == 3) {
      $rootScope.loadingOn = true;
      $scope.questionInfo['room_id'] = $routeParams.room_id;
      $scope.questionInfo['type'] = 0;

      $http.post('/api/room/question', $scope.questionInfo)
        .success(function(data) {
          // Get new questions.
          $rootScope.getQuestions();
          $rootScope.getMyQuestions();

          // The new question.
          var newQuestionId = data[(data.length - 1)]._id;

          // Emit new question.
          socket.emit('questions:change', {room_id: $routeParams.room_id, question_id: newQuestionId, status: 'up'});
        })
        .error(function(data) {
          console.log('Error: ' + data);
        })
        .finally(function() {
          $rootScope.loadingOn = false;
        });

      return;
    }

    $rootScope.questionSidebar(true);
    $rootScope.questionAskForm = true;
    $rootScope.questionEditForm = false;
  };

  // Edit question.
  $scope.editQuestion = function(question_id, question_desc, question_anonymous) {
    $rootScope.questionSidebar(true);
    $rootScope.questionAskForm = false;
    $rootScope.questionEditForm = true;

    $scope.editQuestionId = question_id;
    $scope.editQuestionDesc = question_desc;
    $scope.editQuestionAnonymous = question_anonymous;
  };

  $scope.cancelQuestionConfirm = function(question_id) {
    $scope.cancelQuestionId = question_id;
    $rootScope.modalOn('modal-delete-question');
  };

  $scope.cancelQuestion = function() {
    $rootScope.loadingOn = true;

    $http.post('/api/room/question/cancel', {
      'question_id': $scope.cancelQuestionId
    }).success(function(data) {
      $rootScope.getQuestions();
      $rootScope.modalOff();

      // Emit change
      socket.emit('questions:change', {room_id: $routeParams.room_id, question_id: $scope.cancelQuestionId, status: 'down'});
    })
    .finally(function() {
      $rootScope.loadingOn = false;
    });
  };

  $scope.voteQuestion = function(question_id, remove) {
    $rootScope.loadingOn = true;

    if (remove) {
      $http.post('/api/room/question/vote/down', {
        'question_id': question_id
      }).success(function(data) {
        $rootScope.getQuestions();

        // Emit change
        socket.emit('questions:change', {room_id: $routeParams.room_id, question_id: question_id, status: 'vote'});
      })
      .finally(function() {
        $timeout(function() {
          $rootScope.loadingOn = false;
        }, 550);
      });
    }
    else {
      $http.post('/api/room/question/vote/up', {
        'question_id': question_id
      }).success(function(data) {
        $rootScope.getQuestions();

        // Emit change
        socket.emit('questions:change', {room_id: $routeParams.room_id, question_id: question_id, status: 'vote'});
      })
      .finally(function() {
        $timeout(function() {
          $rootScope.loadingOn = false;
        }, 550);
      });
    }
  };

  // These functions are for the host handling questions.
  $scope.completeQuestion = function() {
    $scope.answeredLoading = true;
    socket.emit('questions:answering', {room_id: $routeParams.room_id, state: 'start'});

    $http.post('/api/room/question-complete', {
      question_id: $scope.questions[0]._id,
      room_id: $routeParams.room_id
    })
    .success(function(data) {
      $scope.activeQuestion();
      $rootScope.getQuestions();
    })
  .finally(function() {
      $timeout(function() {
        $scope.answeredLoading = false;
        socket.emit('questions:answering', {room_id: $routeParams.room_id, state: 'done'});
      }, 1250);
    });
  };

  // Set Active Question
  $scope.activeQuestion = function() {
    if ($scope.questions[1]) {
      $http.post('/api/room/question-active', {
        question_id: $scope.questions[1]._id,
        room_id: $routeParams.room_id
      }).success(function(data) {
        socket.emit('questions:change', {room_id: $routeParams.room_id });
      });
    }
    else {
      socket.emit('questions:change', {room_id: $routeParams.room_id });
    }
  }

  // Question Forms
  $rootScope.questionSidebar = function(state) {
    if (state) {
      $rootScope.questionOn = true;
      $timeout(function() {
        $rootScope.questionIn = true;
      }, 50);
    }
    else {
      if ($rootScope.questionIn) {
        $rootScope.questionIn = false;
        $timeout(function() {
          $rootScope.questionOn = false;
        }, 500);
      }
    }
  }

  // Listiening To Answering Questions
  socket.on('questions:answering', function (data) {
    // Check if that's this room.
    // And this person needs to know.
    if (data.room_id == $routeParams.room_id && $scope.attendeeCheckId) {
      if (data.state == 'start') {
        $scope.answeredLoading = true;
      }
      else if (data.state == 'done') {
        $scope.answeredLoading = false;
      }
    }
  });

  // Scope Permission Check
  $scope.checkPermission = function(permissionName) {
    return permService.checkPermission($scope.attendeeCheckId, permissionName);
  }

  // Bring in the UI Services.
  ui.isios();
  $scope.idExists = ui.idExists;

  var promisePermission = permService.getPermissions();

  promisePermission.then(function(data) {
    $scope.checkPermission();
  });

  // Initiate
  $rootScope.getRoom();
});
