const route = require('express').Router();
const User = require('../models/User');

route.post('/user', async (req, res) => {
  const { _id, email, familyName, givenName, name, photoUrl } = req.body;
  try {
    const userExists = await User.findOne({ _id });
    if (userExists) return res.send('User exists');

    const newUser = await User.create({
      _id,
      email,
      familyName,
      givenName,
      name,
      photoUrl,
      matchedWith: null,
      matchedMovies: [],
      watchedMovies: [],
      ignoredMovies: [],
    });

    res.send(newUser);
  } catch (err) {
    res.status(400);
  }
});

route.get('/user', async (req, res) => {
  const { id } = req.query;

  try {
    const user = await User.findOne({ _id: id });
    return res.send(user);
  } catch (err) {
    res.status(400);
  }
});

route.get('/users', async (req, res) => {
  const { q, _id } = req.query;
  try {
    const users = await User.find({
      _id: { $not: { $regex: _id } },
      $or: [
        {
          givenName: { $regex: q, $options: 'iy' },
        },
        { name: { $regex: q, $options: 'iy' } },
        { email: { $regex: q, $options: 'iy' } },
        {
          familyName: { $regex: q, $options: 'iy' },
        },
      ],
    })
      .collation({ locale: 'en', strength: 1 })
      .limit(20);

    res.send(users);
  } catch (err) {
    return res.status(404);
  }
});

route.post('/user/movies', async (req, res) => {
  const { _id, watchedMovies, ignoredMovies } = req.body;
  try {
    if (watchedMovies)
      await User.updateOne(
        { _id },
        {
          $push: {
            watchedMovies,
          },
        }
      );
    if (ignoredMovies)
      await User.updateOne(
        { _id },
        {
          $push: {
            ignoredMovies,
          },
        }
      );

    const user = await User.findOne({ _id });

    res.send(user);
  } catch (err) {
    res.status(400);
  }
});

route.post('/user/movies/delete', async (req, res) => {
  const { _id, watchedMovies, ignoredMovies } = req.body;
  try {
    if (watchedMovies)
      await User.updateOne(
        { _id },
        { $pull: { watchedMovies: { $in: watchedMovies } } }
      );
    if (ignoredMovies)
      await User.updateOne(
        { _id },
        { $pull: { ignoredMovies: { $in: ignoredMovies } } }
      );

    const user = await User.findOne({ _id });

    res.send(user);
  } catch (err) {
    res.status(400);
  }
});

module.exports = route;
