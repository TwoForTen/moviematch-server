const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

mongoose.connect(
  'mongodb+srv://admin:wgdWZLTDcPMj2rG7@moviematch-1.kpsx3.mongodb.net/moviematch?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => console.log('DB connected')
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

let clients = {};

io.on('connection', (socket) => {
  socket.on('clientJoined', (_id) => {
    clients[_id] = socket.id;
  });

  socket.on('pairRequest', async ({ senderId, recipientId }) => {
    const recipient = await User.findOneAndUpdate(
      { _id: recipientId },
      {
        $push: {
          receivedPairRequests: senderId,
        },
      },
      { new: true }
    );
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        sentPairRequest: recipientId,
      },
      { new: true }
    );

    io.to(clients[recipientId]).emit('userStateUpdate', recipient);
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('deletePairRequest', async ({ senderId, recipientId }) => {
    const recipient = await User.findOneAndUpdate(
      { _id: recipientId },
      {
        $pull: {
          receivedPairRequests: { $in: senderId },
        },
      },
      { new: true }
    );
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        sentPairRequest: null,
      },
      { new: true }
    );

    io.to(clients[recipientId]).emit('userStateUpdate', recipient);
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('declinePairRequest', async ({ senderId, recipientId }) => {
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        $pull: {
          receivedPairRequests: { $in: recipientId },
        },
      },
      { new: true }
    );
    const recipient = await User.findOneAndUpdate(
      { _id: recipientId },
      {
        sentPairRequest: null,
      },
      { new: true }
    );

    io.to(clients[recipientId]).emit('userStateUpdate', recipient);
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('match', async ({ senderId, recipientId }) => {
    const recipient = await User.findOneAndUpdate(
      { _id: recipientId },
      {
        sentPairRequest: null,
        $pull: {
          receivedPairRequests: { $in: senderId },
        },
        matchedWith: {
          matchId: senderId + recipientId,
          notifications: 0,
          match: senderId,
        },
      },
      { new: true }
    );
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        sentPairRequest: null,
        $pull: {
          receivedPairRequests: { $in: recipientId },
        },
        matchedWith: {
          matchId: senderId + recipientId,
          notifications: 0,
          match: recipientId,
        },
      },
      { new: true }
    );
    io.to(clients[recipientId]).emit('userStateUpdate', recipient);
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('unmatch', async ({ senderId, recipientId }) => {
    const recipient = await User.findOneAndUpdate(
      { _id: recipientId },
      {
        matchedWith: null,
      },
      { new: true }
    );
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      {
        matchedWith: null,
      },
      { new: true }
    );
    io.to(clients[recipientId]).emit('userStateUpdate', recipient);
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('addToWatchlist', async ({ senderId, movie }) => {
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      { $push: { matchedMovies: movie } },
      { new: true }
    );
    io.to(clients[senderId]).emit('userStateUpdate', sender);

    const isMatched = sender.matchedWith;
    if (isMatched) {
      try {
        const match = await User.findOne({ _id: isMatched.match }).select({
          matchedMovies: 1,
        });
        if (isMatched && match.matchedMovies.includes(movie)) {
          io.in(isMatched.matchId).emit('matchedMovie', movie);
          await User.updateMany(
            {
              _id: { $in: [senderId, isMatched.match] },
            },
            { $inc: { 'matchedWith.notifications': 1 } }
          );
          io.to(clients[senderId]).emit(
            'userStateUpdate',
            await User.findOne({ _id: senderId })
          );
          io.to(clients[isMatched.match]).emit(
            'userStateUpdate',
            await User.findOne({ _id: isMatched.match })
          );
        }
      } catch (err) {}
    }
  });

  socket.on('removeFromWatchlist', async ({ senderId, movie }) => {
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      { $pull: { matchedMovies: { $in: movie } } },
      { new: true }
    );
    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('clearNotifications', async (senderId) => {
    const sender = await User.findOneAndUpdate(
      { _id: senderId },
      { $set: { 'matchedWith.notifications': 0 } },
      { new: true }
    );

    io.to(clients[senderId]).emit('userStateUpdate', sender);
  });

  socket.on('joinMatch', (matchId) => {
    socket.join(matchId);
  });

  socket.on('leaveMatch', (matchId) => {
    socket.leave(matchId);
  });

  socket.on('userDisconnect', (_id) => {
    delete clients[_id];
  })
});

const routes = require('./routes/userRoutes');
app.use('/api', routes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
