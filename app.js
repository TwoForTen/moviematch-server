const express = require('express');
const mongoose = require('mongoose');

const app = express();
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
