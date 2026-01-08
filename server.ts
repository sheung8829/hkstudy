import express from 'express';
import cors from 'cors';
import { ttsSave, tts } from 'edge-tts';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

// Allow CORS for everyone (since frontend and backend are on same Vercel domain usually)
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// --- Firebase Setup (Lazy Initialization) ---
let db;

const getDb = () => {
  if (!db) {
    if (!admin.apps.length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccountKey) {
        try {
          const formattedKey = serviceAccountKey.replace(/\\n/g, '\n');
          const serviceAccount = JSON.parse(formattedKey);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          console.log('Firebase initialized successfully');
        } catch (error) {
          console.error('Error initializing Firebase:', error);
          throw new Error('Firebase init failed');
        }
      } else {
         console.warn('FIREBASE_SERVICE_ACCOUNT missing');
         throw new Error('Missing Firebase Config');
      }
    }
    db = admin.firestore();
  }
  return db;
};

// app.use(cors()); // Already configured above
app.use(express.json());

// --- Debug Route ---
app.get('/api/debug', (req, res) => {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT;
  const status = {
    hasKey: !!key,
    keyLength: key ? key.length : 0,
    firebaseApps: admin.apps.length,
    nodeEnv: process.env.NODE_ENV,
    cors: 'configured'
  };
  
  try {
    if (key) {
      const formatted = key.replace(/\\n/g, '\n');
      JSON.parse(formatted);
      // @ts-ignore
      status.jsonParse = 'success';
    }
  } catch (e) {
    // @ts-ignore
    status.jsonParse = 'failed: ' + e.message;
  }
  
  res.json(status);
});

// --- Auth Routes ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    
    // Check if user exists
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', username).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: '使用者名稱已被使用' });
    }

    // Create new user
    const newUserRef = usersRef.doc();
    const newUser = {
      id: newUserRef.id,
      username,
      password,
      createdAt: Date.now()
    };
    
    await newUserRef.set(newUser);

    res.json(newUser);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '註冊失敗' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = getDb();
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('username', '==', username)
      .where('password', '==', password)
      .get();

    if (snapshot.empty) {
      return res.status(401).json({ error: '帳號或密碼錯誤' });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();
    
    res.json({
      id: user.id,
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
    const db = getDb();
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('username', '==', email).get();
    
    let user;

    if (snapshot.empty) {
      // Create new user if not exists
      const newUserRef = usersRef.doc();
      user = { 
        id: newUserRef.id,
        username: email, 
        googleId, 
        createdAt: Date.now() 
      };
      await newUserRef.set(user);
    } else {
      // Update existing user with googleId if needed
      const userDoc = snapshot.docs[0];
      user = userDoc.data();
      if (!user.googleId) {
        await userDoc.ref.update({ googleId });
        user.googleId = googleId;
      }
    }

    res.json({ 
      id: user.id, 
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
    const db = getDb();
    
    const dataRef = db.collection('userData').doc(userId);
    const doc = await dataRef.get();
    
    if (!doc.exists) {
      return res.json({ words: [], lessons: [] });
    }

    const data = doc.data();
    res.json({ words: data?.words || [], lessons: data?.lessons || [] });
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
    const db = getDb();

    const dataRef = db.collection('userData').doc(userId);
    await dataRef.set({
      userId,
      words,
      lessons,
      updatedAt: Date.now()
    }, { merge: true });

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
    // 2nd argument is voice string, not options object
    const buffer = await tts(text, "zh-HK-HiuGaaiNeural");
    
    // Send buffer directly
    res.set('Content-Type', 'audio/mpeg');
    res.send(buffer);

  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).send('TTS generation failed');
  }
});

// Export the app for Vercel
export default app;

// Only listen if running locally (not in Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
