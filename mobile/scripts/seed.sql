-- Seed SQL for Zovo App
-- Run this directly in Supabase SQL Editor (Dashboard > SQL Editor)
-- This bypasses RLS policies and inserts data directly

-- First, let's make sure the tables exist with proper structure
-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  skills TEXT[] DEFAULT '{}',
  area TEXT,
  total_views INTEGER DEFAULT 0,
  total_shares INTEGER DEFAULT 0,
  total_endorsements INTEGER DEFAULT 0,
  device_fingerprint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table if not exists
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'photo',
  caption TEXT,
  skills TEXT[] DEFAULT '{}',
  area TEXT,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  endorsement_count INTEGER DEFAULT 0,
  trending_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create engagements table if not exists
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  platform TEXT,
  message TEXT,
  device_fingerprint TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clear existing seed data (optional - comment out if you want to keep existing data)
DELETE FROM engagements WHERE user_id IN (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'
);

DELETE FROM posts WHERE user_id IN (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'
);

DELETE FROM users WHERE id IN (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b'
);

-- Insert 5 Nigerian Workers
INSERT INTO users (id, phone, name, whatsapp, skills, area, total_views, total_shares, total_endorsements)
VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', '+2348012345678', 'Chidi Okonkwo', '+2348012345678', ARRAY['Electrician', 'AC Technician'], 'Lekki', 1250, 45, 89),
  ('b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', '+2348023456789', 'Amaka Johnson', '+2348023456789', ARRAY['Hair Stylist', 'Makeup Artist'], 'Victoria Island', 2340, 78, 156),
  ('c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', '+2348034567890', 'Emeka Nwosu', '+2348034567890', ARRAY['Plumber', 'Tiler'], 'Ikeja', 890, 32, 67),
  ('d4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', '+2348045678901', 'Fatima Bello', '+2348045678901', ARRAY['Tailor', 'Fashion Designer'], 'Surulere', 1560, 56, 112),
  ('e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', '+2348056789012', 'Kunle Adeyemi', '+2348056789012', ARRAY['Auto Mechanic', 'Panel Beater'], 'Yaba', 1120, 41, 94);

-- Insert Posts for each user (2 posts each)
INSERT INTO posts (id, user_id, media_url, media_type, caption, skills, area, view_count, share_count, endorsement_count, trending_score)
VALUES
  -- Chidi - Electrician
  ('f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800', 'photo',
   'Just completed full house wiring for a 4-bedroom duplex in Lekki Phase 1. All cables properly concealed, DB board installed with surge protection. Quality work, no shortcuts! Available for residential and commercial electrical jobs.',
   ARRAY['Electrician'], 'Lekki', 680, 24, 48, 75),

  ('f2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
   'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800', 'photo',
   'AC installation and servicing completed today. Split unit properly mounted, copper pipes insulated, and drainage sorted. Beat the Lagos heat with a properly working AC! Weekend appointments available.',
   ARRAY['AC Technician'], 'Lekki', 570, 21, 41, 68),

  -- Amaka - Hair Stylist & Makeup Artist
  ('f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
   'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800', 'photo',
   'Bridal glam for my beautiful client! Full beat makeup with lashes, and elegant updo hairstyle. She looked absolutely stunning on her special day. Book early for wedding season - slots filling up fast!',
   ARRAY['Makeup Artist', 'Hair Stylist'], 'Victoria Island', 1340, 52, 98, 92),

  ('f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
   'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', 'photo',
   'Knotless braids done for a client today. Clean partings, no tension on the edges. I specialize in protective styles that keep your natural hair healthy. Home service available in VI and Lekki.',
   ARRAY['Hair Stylist'], 'Victoria Island', 1000, 26, 58, 78),

  -- Emeka - Plumber & Tiler
  ('f5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
   'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800', 'photo',
   'Complete bathroom renovation finished today in Ikeja GRA. New toilet, shower, tiles from floor to ceiling. No leaks guaranteed! From demolition to final polish, I handle everything.',
   ARRAY['Plumber', 'Tiler'], 'Ikeja', 520, 18, 38, 62),

  ('f6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
   'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', 'photo',
   'Kitchen sink and water heater installation done. Proper PVC piping, no shortcuts. If your tap is dripping or you need new plumbing work, call me. Same day service for emergencies!',
   ARRAY['Plumber'], 'Ikeja', 370, 14, 29, 55),

  -- Fatima - Tailor & Fashion Designer
  ('f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c', 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
   'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800', 'photo',
   'Custom agbada set completed for a client. Hand-embroidered details, perfect fit. Traditional Nigerian wear with modern touches. DM for orders - I work with ankara, lace, and aso-oke.',
   ARRAY['Tailor', 'Fashion Designer'], 'Surulere', 890, 32, 65, 82),

  ('f8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d', 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
   'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 'photo',
   'Aso-ebi for a wedding party - 15 pieces delivered on time! I specialize in group orders for owambe. Consistent quality across all pieces. Book 3 weeks in advance for large orders.',
   ARRAY['Tailor'], 'Surulere', 670, 24, 47, 72),

  -- Kunle - Auto Mechanic & Panel Beater
  ('f9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
   'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800', 'photo',
   'Toyota Camry engine overhaul completed. This car came in knocking badly - now it runs smooth like butter! Full timing belt replacement, new gaskets, and oil change. I specialize in Toyota and Honda.',
   ARRAY['Auto Mechanic'], 'Yaba', 640, 23, 52, 70),

  ('fad1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
   'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800', 'photo',
   'Panel beating and spray painting done on this Honda Accord. Accident damage completely fixed - you cannot even tell! Full body work, primer, and factory-match paint. Bring your damaged car, I will restore it.',
   ARRAY['Panel Beater'], 'Yaba', 480, 18, 42, 65);

-- Insert some cross-endorsements between workers
INSERT INTO engagements (id, post_id, user_id, type, message, created_at)
VALUES
  -- Endorsements for Chidi's posts
  (gen_random_uuid(), 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'endorsement', 'Chidi did excellent work at my salon. Highly recommended!', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'endorsement', 'Very professional electrician. Fixed my issues quickly.', NOW() - INTERVAL '3 days'),

  -- Endorsements for Amaka's posts
  (gen_random_uuid(), 'f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'endorsement', 'Amaka did amazing makeup for my sister wedding!', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), 'f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e', 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'endorsement', 'Best makeup artist in VI! Always recommend her to my clients.', NOW() - INTERVAL '2 days'),

  -- Endorsements for Emeka's posts
  (gen_random_uuid(), 'f5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 'endorsement', 'Emeka fixed my bathroom leak same day. Great work!', NOW() - INTERVAL '4 days'),

  -- Endorsements for Fatima's posts
  (gen_random_uuid(), 'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 'endorsement', 'Fatima made the most beautiful aso-ebi for my wedding party!', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), 'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'endorsement', 'Quality tailor. My agbada fit perfectly.', NOW() - INTERVAL '1 day'),

  -- Endorsements for Kunle's posts
  (gen_random_uuid(), 'f9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e', 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f', 'endorsement', 'Kunle saved my car! Engine was knocking, now runs perfectly.', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), 'fad1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f', 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a', 'endorsement', 'Best panel beater in Yaba. My car looks brand new!', NOW() - INTERVAL '3 days');

-- Verify the data was inserted
SELECT 'Users inserted: ' || COUNT(*)::TEXT FROM users;
SELECT 'Posts inserted: ' || COUNT(*)::TEXT FROM posts;
SELECT 'Engagements inserted: ' || COUNT(*)::TEXT FROM engagements;
