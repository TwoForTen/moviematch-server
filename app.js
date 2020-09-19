const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

mongoose.connect(
  'mongodb://localhost:27017/moviematch',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => console.log('DB connected')
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

io.on('connection', (socket) => {
  console.log('socket');
});

const routes = require('./routes/userRoutes');
app.use('/api', routes);

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
