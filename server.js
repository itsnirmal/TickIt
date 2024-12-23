// Import required modules
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Added for JWT

// Initialize Express
const app = express();
const PORT = process.env.PORT || 10000;

// Step 1: Database Connection
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas!'))
  .catch((err) => console.error('Error connecting to MongoDB Atlas:', err));

// Step 2: User Schema and Model
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  googleId: String, // For Google OAuth login
  todos: { type: Array, default: [] },
});

const User = mongoose.model('User', UserSchema);

// Step 3: Middleware
app.use(express.json());
app.use(cors({
  origin: 'https://tickitna.vercel.app/', // Adjust to your frontend's URL
  credentials: true,
}));

// Utility functions for JWT
const generateToken = (user) => {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract Bearer token
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: Invalid token' });
    req.user = user; // Attach user to the request
    next();
  });
};

// Step 4: Routes

// Sign Up
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'Signup successful! Please log in.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    const token = generateToken(user);
    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Get Todos (Protected Route)
app.get('/api/todos', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Save Todos (Protected Route)
app.post('/api/todos', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.todos = req.body.todos; // Update todos
    await user.save();
    res.status(200).json({ message: 'Todos saved successfully!' });
  } catch (error) {
    console.error('Error saving todos:', error);
    res.status(500).json({ message: 'Failed to save todos.' });
  }
});

// Step 5: Start the Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
