const initSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    // Join tournament room for live updates
    socket.on('join_tournament', (tournamentId) => {
      socket.join(`tournament:${tournamentId}`);
    });

    // Join spectator room
    socket.on('join_spectator', (tournamentId) => {
      socket.join(`spectator:${tournamentId}`);
    });

    // Leave room
    socket.on('leave_tournament', (tournamentId) => {
      socket.leave(`tournament:${tournamentId}`);
    });

    // Real-time kill updates (broadcast to spectators)
    socket.on('kill_update', async ({ tournamentId, userId, kills }) => {
      io.to(`spectator:${tournamentId}`).emit('kill_update', {
        userId, kills, timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {});
  });
};

module.exports = { initSocketHandlers };
