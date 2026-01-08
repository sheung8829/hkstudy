# Deployment and Production Setup

## 1. Environment Configuration
- [ ] Create `.env.production` file
- [ ] Set `VITE_API_URL` to production backend URL (e.g., Netlify/Vercel function or dedicated VPS)
- [ ] Configure `VITE_GOOGLE_CLIENT_ID` for production domain

## 2. Backend Deployment (TTS Service)
- [ ] Deploy `server.ts` to a Node.js hosting service (e.g., Render, Railway, or Heroku)
- [ ] Ensure `edge-tts` dependency is included in production build
- [ ] Set up CORS policies to allow requests only from the frontend domain
- [ ] Update frontend `SpeakButton.tsx` to point to the production TTS API URL instead of `localhost:3001`

## 3. Frontend Deployment
- [ ] Build the React app using `npm run build`
- [ ] Deploy the `dist` folder to a static host (e.g., Netlify, Vercel, GitHub Pages)
- [ ] Configure rewrite rules for SPA (Single Page Application) routing (e.g., `/*` -> `/index.html`)

## 4. Verification
- [ ] Verify Google Login works on the production domain
- [ ] Test TTS functionality on production to ensure the backend proxy is reachable
- [ ] Check all other features (CRUD operations, image uploads) in the production environment
