import express from 'express';
import cors from 'cors';
import { ttsSave, tts } from 'edge-tts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Database Setup ---
const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

const USERS_FILE = path.join(DB_DIR, 'users.json');
const DATA_FILE = path.join(DB_DIR, 'data.json');

const readJson = (file: string, defaultValue: any = []) => {
    if (!fs.existsSync(file)) return defaultValue;
    try {
        return JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch (e) { return defaultValue; }
};

const writeJson = (file: string, data: any) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// --- Auth Routes ---
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    const users = readJson(USERS_FILE, []);
    // @ts-ignore
    if (users.find((u) => u.username === username)) {
        return res.status(400).json({ error: '使用者名稱已被使用' });
    }
    const newUser = { id: crypto.randomUUID(), username, password, createdAt: Date.now() };
    users.push(newUser);
    writeJson(USERS_FILE, users);
    res.json(newUser);
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const users = readJson(USERS_FILE, []);
    // @ts-ignore
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ error: '帳號或密碼錯誤' });
    res.json(user);
});

app.post('/api/auth/google', (req, res) => {
    const { email, googleId } = req.body;
    const users = readJson(USERS_FILE, []);
    // @ts-ignore
    let user = users.find((u) => u.username === email);
    if (!user) {
        user = { id: googleId, username: email, createdAt: Date.now() };
        users.push(user);
        writeJson(USERS_FILE, users);
    }
    res.json(user);
});

// --- Data Routes ---
app.get('/api/data/:userId', (req, res) => {
    const { userId } = req.params;
    const dataStore = readJson(DATA_FILE, {});
    // @ts-ignore
    res.json(dataStore[userId] || { words: [], lessons: [] });
});

app.post('/api/data/:userId', (req, res) => {
    const { userId } = req.params;
    const { words, lessons } = req.body;
    const dataStore = readJson(DATA_FILE, {});
    // @ts-ignore
    dataStore[userId] = { words, lessons };
    writeJson(DATA_FILE, dataStore);
    res.json({ success: true });
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
  console.log(`TTS Server running at http://localhost:${port}`);
});
