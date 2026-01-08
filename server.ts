import express from 'express';
import cors from 'cors';
import { ttsSave, tts } from 'edge-tts';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// MongoDB Connection String
// In production (Render), this will be set in Environment Variables
// In local, you can create a .env file or hardcode it temporarily for testing
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

// --- MongoDB Schemas ---
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String }, // Optional for Google users
  googleId: { type: String },
  createdAt: { type: Number, default: Date.now }
});

const dataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  words: { type: Array, default: [] },
  lessons: { type: Array, default: [] },
  updatedAt: { type: Number, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const UserData = mongoose.model('UserData', dataSchema);

// Connect to MongoDB
if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('No MONGODB_URI provided. Database features will fail unless configured.');
}

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: '使用者名稱已被使用' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    // Return user info (map _id to id)
    res.json({ 
      id: newUser._id.toString(), 
      username: newUser.username, 
      createdAt: newUser.createdAt 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '註冊失敗' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    res.json({ 
      id: user._id.toString(), 
      username: user.username, 
      createdAt: user.createdAt 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '登入失敗' });
  }
});

// Google Login
app.post('/api/auth/google', async (req, res) => {
  try {
    const { email, googleId } = req.body;
    
    let user = await User.findOne({ username: email });
    
    if (!user) {
      // Create new user if not exists
      user = new User({ 
        username: email, 
        googleId, 
        createdAt: Date.now() 
      });
      await user.save();
    } else if (!user.googleId) {
      // Link Google ID if user exists but hasn't linked (optional logic)
      user.googleId = googleId;
      await user.save();
    }

    res.json({ 
      id: user._id.toString(), 
      username: user.username, 
      createdAt: user.createdAt 
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ error: 'Google 登入失敗' });
  }
});

// --- Data Routes ---

// Get User Data
app.get('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const data = await UserData.findOne({ userId });
    
    if (!data) {
      return res.json({ words: [], lessons: [] });
    }

    res.json({ words: data.words, lessons: data.lessons });
  } catch (error) {
    console.error('Get data error:', error);
    res.status(500).json({ error: '讀取資料失敗' });
  }
});

// Save User Data
app.post('/api/data/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { words, lessons } = req.body;

    await UserData.findOneAndUpdate(
      { userId },
      { userId, words, lessons, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Save data error:', error);
    res.status(500).json({ error: '儲存資料失敗' });
  }
});

// --- TTS Route ---
app.get('/api/tts', async (req, res) => {
  const { text } = req.query;

  if (!text || typeof text !== 'string') {
    return res.status(400).send('Text parameter is required');
  }

  try {
    // Generate TTS buffer directly using 'tts' function
    const buffer = await tts(text, {
        voice: "zh-HK-HiuGaaiNeural",
        outputFormat: "audio-24khz-48kbitrate-mono-mp3"
    });
    
    // Send buffer directly
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).send('TTS generation failed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
