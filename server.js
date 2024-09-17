const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

if (!process.env.JWT_SECRET) {
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String, required: true },
  status: { type: String, default: 'active' },
  registrationDate: { type: Date, default: Date.now },
  lastLoginDate: { type: Date },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    const user = await User.findById(decoded.id);

    if (!user) return res.sendStatus(404);
    
    if (user.status === 'blocked') {
      const blockedBy = await User.findById(user.blockedBy);
      return res.status(403).json({ 
        message: 'User is blocked', 
        blockedBy: blockedBy ? blockedBy.name : 'Unknown' 
      });
    } else if (user.status === 'deleted') {
      return res.status(403).json({ 
        message: 'User is deleted' 
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.sendStatus(403);
  }
};

app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword, name });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'User is blocked', blockedBy: user.blockedBy });
    }

    if (user.status === 'deleted') {
      return res.status(403).json({ message: 'User is deleted' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    user.lastLoginDate = new Date();
    await user.save();

    const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/block', authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  try {
    const blocker = await User.findById(req.user._id);
    
    await User.updateMany({ _id: { $in: userIds } }, { 
      $set: { status: 'blocked', blockedBy: blocker._id } 
    });
    res.status(200).json({ message: 'Users blocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/users/unblock', authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  try {
    await User.updateMany({ _id: { $in: userIds } }, { $set: { status: 'active' } });
    res.status(200).json({ message: 'Users unblocked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/users/delete', authenticateToken, async (req, res) => {
  const { userIds } = req.body;
  try {
    await User.deleteMany({ _id: { $in: userIds } });
    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
