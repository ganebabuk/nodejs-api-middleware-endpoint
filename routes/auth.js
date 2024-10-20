const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Dummy user database (replace with a real database in production)
const users = [];

// Sign-up route
router.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  // Check if user already exists
  const userExists = users.find((user) => user.username === username);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Save new user (this would be saved to a DB in a real app)
  const newUser = { username, password: hashedPassword };
  users.push(newUser);

  res.status(201).json({ message: 'User created successfully' });
});

// Login route
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists
  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Validate password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Create a JWT token
  const payload = {
    user: {
      username: user.username,
    },
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '1h' }, // Token expires in 1 hour
    (err, token) => {
      if (err) throw err;
      res.json({ token });
    }
  );
});

// Login route
router.get('/login2', async (req, res) => {
    
    // Create a JWT token
    const payload = {
      user: {
        username: 'kganeshbabu.it@gmail.com',
      },
    };
  
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expires in 1 hour
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  });

  // protected route i.e. without token can't access
  router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: `Welcome ${req.user.username}, this is your profile.` });
  });

module.exports = router;
