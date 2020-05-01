module.exports = function (socket, io) {
  // Listen for room creation.
  socket.on('rooms:change', function(data) {
    socket.broadcast.emit('rooms:change', data);
  });

  // Listen for room setting changes.
  socket.on('room:settings', function(data) {
    socket.broadcast.emit('room:settings', data);
  });

  socket.on('room:end', function(data) {
    socket.broadcast.emit('room:end', data);
    socket.broadcast.emit('room:change', data);
  });

  // Listen for new attendees.
  socket.on('attendees:change', function(data) {
    socket.broadcast.emit('attendees:change', data);
  });

  // Listen for new questions.
  socket.on('questions:change', function(data) {
    socket.broadcast.emit('questions:change', data);
  });

  // Listen for question answered.
  socket.on('questions:answering', function(data) {
    socket.broadcast.emit('questions:answering', data);
  });
}