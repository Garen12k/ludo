-- Space Ludo Online Multiplayer Schema
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table - stores game rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(6) UNIQUE NOT NULL,
    host_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
    max_players INT DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    game_state JSONB
);

-- Players table - stores players in rooms
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20),
    slot INT CHECK (slot >= 0 AND slot < 4),
    is_host BOOLEAN DEFAULT FALSE,
    is_connected BOOLEAN DEFAULT TRUE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game actions table - stores game events for synchronization
CREATE TABLE IF NOT EXISTS game_actions (
    id SERIAL PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    player_slot INT,
    action_type VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_code ON rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);
CREATE INDEX IF NOT EXISTS idx_players_room_id ON players(room_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_room_id ON game_actions(room_id);
CREATE INDEX IF NOT EXISTS idx_game_actions_created_at ON game_actions(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_actions ENABLE ROW LEVEL SECURITY;

-- Policies for rooms table
-- Anyone can read rooms (to join by code)
CREATE POLICY "Rooms are readable by everyone" ON rooms
    FOR SELECT USING (true);

-- Anyone can create rooms
CREATE POLICY "Anyone can create rooms" ON rooms
    FOR INSERT WITH CHECK (true);

-- Anyone can update rooms (for simplicity - in production, restrict to host)
CREATE POLICY "Anyone can update rooms" ON rooms
    FOR UPDATE USING (true);

-- Anyone can delete rooms (host cleanup)
CREATE POLICY "Anyone can delete rooms" ON rooms
    FOR DELETE USING (true);

-- Policies for players table
-- Anyone can read players in a room
CREATE POLICY "Players are readable by everyone" ON players
    FOR SELECT USING (true);

-- Anyone can join a room (insert player)
CREATE POLICY "Anyone can join rooms" ON players
    FOR INSERT WITH CHECK (true);

-- Anyone can update their player status
CREATE POLICY "Anyone can update players" ON players
    FOR UPDATE USING (true);

-- Anyone can leave a room (delete player)
CREATE POLICY "Anyone can leave rooms" ON players
    FOR DELETE USING (true);

-- Policies for game_actions table
-- Anyone can read game actions
CREATE POLICY "Game actions are readable by everyone" ON game_actions
    FOR SELECT USING (true);

-- Anyone can insert game actions
CREATE POLICY "Anyone can insert game actions" ON game_actions
    FOR INSERT WITH CHECK (true);

-- Enable Realtime for these tables
-- This allows clients to subscribe to changes
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_actions;

-- Function to clean up old rooms (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rooms()
RETURNS void AS $$
BEGIN
    DELETE FROM rooms
    WHERE created_at < NOW() - INTERVAL '24 hours'
    AND status != 'playing';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up old rooms
-- Note: This requires Supabase Pro plan. For free tier, cleanup manually or via client.
-- SELECT cron.schedule('cleanup-old-rooms', '0 0 * * *', 'SELECT cleanup_old_rooms()');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
