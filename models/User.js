const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    _id: String,
    name: String,
    givenName: String,
    familyName: String,
    photoUrl: String,
    email: String,
    matchedWith: {
      matchId: String,
      notifications: Number,
      match: String,
    },
    sentPairRequest: String,
    receivedPairRequests: [String],
    matchedMovies: [Number],
    watchedMovies: [Number],
    ignoredMovies: [Number],
  },
  { _id: false, versionKey: false }
);

module.exports = model('User', userSchema);
