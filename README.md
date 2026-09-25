# Tic Tac Toe

React + Vite game with optional Google sign-in and MongoDB cloud saves.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `GOOGLE_CLIENT_ID` and a random `SESSION_SECRET` of at least 32 characters.
3. Ensure the ignored `atlas-credentials.env` file contains a complete MongoDB connection URI in `MONGODB_URI`. Set `MONGODB_DB` in `.env` if you want a database name other than `tic_tac_toe`.
4. In Google Cloud Console, create an OAuth 2.0 Client ID of type Web application and add `http://localhost:5173` and `http://localhost:5174` as authorized JavaScript origins for local development.
5. Run `npm run dev`. Vite serves the app on port 5173 and proxies `/api` to the Express API on port 3001.

The first Google sign-in creates the MongoDB player document using the current guest profile. Later sign-ins load the account profile; profile updates are saved automatically. Player documents are keyed by Google's verified account ID. The app continues to support guest play with local device saves when cloud configuration is unavailable.

For production, build with `npm run build`, configure the same environment variables on the server, and run `npm start`. The Express server serves `dist` and the API from the same origin. Use HTTPS in production so the session cookie is secure.
