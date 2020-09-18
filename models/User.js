const { Schema } = require('mongoose');

const userSchema = new Schema(
  {
    _id: String,
    name: String,
    givenName: String,
    familyName: String,
    photoUrl: String,
    email: String,
    matchedMovies: [String],
    watchedMovies: [String],
  },
  { _id: false, versionKey: false }
);

module.exports = mongoose.model('User', userSchema);
