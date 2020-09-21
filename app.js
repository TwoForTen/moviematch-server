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
  'mongodb://localhost:27017/moviematch',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => console.log('DB connected')
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const clients = {};

io.on('connection', (socket) => {
  socket.on('clientJoined', (_id) => {
    clients[_id] = socket.id;
  });

  socket.on('pairRequest', async ({ _id, userId }) => {
    const recipient = await User.findOneAndUpdate(
      { _id: userId },
      {
        $push: {
          receivedPairRequests: _id,
        },
      },
      { new: true }
    );
    const request = await User.findOneAndUpdate(
      { _id },
      {
        sentPairRequest: userId,
      },
      { new: true }
    );

    io.to(clients[userId]).emit('userStateUpdate', recipient);
    io.to(clients[_id]).emit('userStateUpdate', request);
  });
});

const routes = require('./routes/userRoutes');
app.use('/api', routes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
