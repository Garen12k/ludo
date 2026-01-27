# Space Ludo

A space-themed Ludo board game built with vanilla JavaScript.

## Features
- Play against AI (Easy, Medium, Hard) or local multiplayer
- **Online Multiplayer** - Play with friends using room codes
- 3D animated dice
- UFO-themed tokens
- In-game chat
- Auto-play timer
- Emoji reactions
- Save/Resume game
- Custom profile pictures

## How to Play
1. Open `index.html` in a browser
2. Choose game mode (vs AI, local multiplayer, or online)
3. Roll dice and move your UFO tokens
4. First to get all 4 tokens home wins!

## Game Rules
- Roll a 6 to unlock a token from your home base
- Move tokens clockwise based on dice value
- Land on opponent's token to capture it (send back to base)
- Star spots are safe zones (no captures)
- Rolling 6 grants an extra turn (max 3 consecutive)
- First player to get all 4 tokens to center wins

## Local Development
Simply open `index.html` in your browser - no server required!

---

## Online Multiplayer Setup (Supabase)

To enable online multiplayer, you need to set up a free Supabase project:

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project" and give it a name (e.g., "space-ludo")
3. Wait for the project to be created

### Step 2: Create Database Tables
1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `supabase-schema.sql` (included in this repo)
3. Click "Run" to create the tables

### Step 3: Configure the Game
1. In your Supabase dashboard, go to Settings > API
2. Copy the "Project URL" and "anon/public" key
3. Open `js/game-bundle.js` and find `SUPABASE_CONFIG` near line 2940
4. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',  // Your Project URL
    anonKey: 'your-anon-key-here'                // Your anon/public key
};
```

### Step 4: Deploy
1. Push your changes to GitHub
2. Vercel will automatically redeploy
3. Open your Vercel URL and click "Play Online"

### How Online Play Works
1. **Create Room**: Enter your name and click "Create Room"
2. **Share Code**: Copy the 6-character room code and share with friends
3. **Join Room**: Friends enter the code to join your lobby
4. **Start Game**: Host clicks "Start Game" when everyone is ready
5. **Play**: Take turns rolling dice and moving tokens in real-time

---

## Deployment

### GitHub
```bash
git add .
git commit -m "Add online multiplayer"
git push
```

### Vercel
The game auto-deploys to Vercel when you push to GitHub.

---

## Tech Stack
- Vanilla JavaScript (ES6+)
- CSS3 with animations
- Supabase Realtime (WebSockets) for multiplayer
- No build tools required

## License
MIT
