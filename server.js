const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();  // Подключение dotenv для работы с переменными окружения

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Проверка наличия переменной JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set');
  process.exit(1);  // Завершение работы сервера, если переменная не установлена
}

mongoose.connect(process.env.MONGO_URI, {
  // Удалены устаревшие опции
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// Определение схемы и модели пользователя
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



// Middleware для проверки токенов
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
    console.error('Token verification error:', err);
    res.sendStatus(403);
  }
};

app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

// Регистрация пользователя
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
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Логин пользователя
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
    console.error('Error during login:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Получение всех пользователей
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id); // Используем идентификатор из `req.user`, а не из `req.user.email`
    if (!user) return res.sendStatus(404);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});




// Блокировка пользователей
app.post('/api/users/block', authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  try {
    const blocker = await User.findById(req.user._id);
    
    await User.updateMany({ _id: { $in: userIds } }, { 
      $set: { status: 'blocked', blockedBy: blocker._id } 
    });
    res.status(200).json({ message: 'Users blocked successfully' });
  } catch (error) {
    console.error('Error blocking users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Разблокировка пользователей
app.post('/api/users/unblock', authenticateToken, async (req, res) => {
  const { userIds } = req.body;

  try {
    await User.updateMany({ _id: { $in: userIds } }, { $set: { status: 'active' } });
    res.status(200).json({ message: 'Users unblocked successfully' });
  } catch (error) {
    console.error('Error unblocking users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Удаление пользователей
app.post('/api/users/delete', authenticateToken, async (req, res) => {
  const { userIds } = req.body;
  console.log('Deleting users with IDs:', userIds);
  try {
    await User.deleteMany({ _id: { $in: userIds } });
    console.log('Users deleted successfully');
    res.status(200).json({ message: 'Users deleted successfully' });
  } catch (error) {
    console.error('Error deleting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
