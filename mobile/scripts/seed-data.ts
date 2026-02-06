/**
 * Seed script to create 5 real Nigerian workers with profiles and posts
 * Run with: bun run scripts/seed-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cfyzrflxkuemgcnfwodx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_eLFmompd6-hFL8RM96GGCQ_EZlpM2_7';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate UUIDs for consistent references
const USER_IDS = {
  chidi: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  amaka: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  emeka: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  fatima: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  kunle: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
};

// 5 Real Nigerian workers with different hustles
const seedUsers = [
  {
    id: USER_IDS.chidi,
    phone: '+2348012345678',
    name: 'Chidi Okonkwo',
    whatsapp: '+2348012345678',
    skills: ['Electrician', 'AC Technician'],
    area: 'Lekki',
    total_views: 0,
    total_shares: 0,
    total_endorsements: 0,
  },
  {
    id: USER_IDS.amaka,
    phone: '+2348023456789',
    name: 'Amaka Johnson',
    whatsapp: '+2348023456789',
    skills: ['Hair Stylist', 'Makeup Artist'],
    area: 'Victoria Island',
    total_views: 0,
    total_shares: 0,
    total_endorsements: 0,
  },
  {
    id: USER_IDS.emeka,
    phone: '+2348034567890',
    name: 'Emeka Nwosu',
    whatsapp: '+2348034567890',
    skills: ['Plumber', 'Tiler'],
    area: 'Ikeja',
    total_views: 0,
    total_shares: 0,
    total_endorsements: 0,
  },
  {
    id: USER_IDS.fatima,
    phone: '+2348045678901',
    name: 'Fatima Bello',
    whatsapp: '+2348045678901',
    skills: ['Tailor', 'Fashion Designer'],
    area: 'Surulere',
    total_views: 0,
    total_shares: 0,
    total_endorsements: 0,
  },
  {
    id: USER_IDS.kunle,
    phone: '+2348056789012',
    name: 'Kunle Adeyemi',
    whatsapp: '+2348056789012',
    skills: ['Auto Mechanic', 'Panel Beater'],
    area: 'Yaba',
    total_views: 0,
    total_shares: 0,
    total_endorsements: 0,
  },
];

// Posts for each user - realistic work showcases
const seedPosts = [
  // Chidi - Electrician
  {
    id: 'f1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c',
    user_id: USER_IDS.chidi,
    media_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800',
    media_type: 'photo',
    caption: 'Just completed full house wiring for a 4-bedroom duplex in Lekki Phase 1. All cables properly concealed, DB board installed with surge protection. Quality work, no shortcuts! Available for residential and commercial electrical jobs.',
    skills: ['Electrician'],
    area: 'Lekki',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  {
    id: 'f2b3c4d5-e6f7-4a8b-9c0d-1e2f3a4b5c6d',
    user_id: USER_IDS.chidi,
    media_url: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800',
    media_type: 'photo',
    caption: 'AC installation and servicing completed today. Split unit properly mounted, copper pipes insulated, and drainage sorted. Beat the Lagos heat with a properly working AC! Weekend appointments available.',
    skills: ['AC Technician'],
    area: 'Lekki',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  // Amaka - Hair Stylist & Makeup Artist
  {
    id: 'f3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
    user_id: USER_IDS.amaka,
    media_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    media_type: 'photo',
    caption: 'Bridal glam for my beautiful client! Full beat makeup with lashes, and elegant updo hairstyle. She looked absolutely stunning on her special day. Book early for wedding season - slots filling up fast!',
    skills: ['Makeup Artist', 'Hair Stylist'],
    area: 'Victoria Island',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  {
    id: 'f4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
    user_id: USER_IDS.amaka,
    media_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    media_type: 'photo',
    caption: 'Knotless braids done for a client today. Clean partings, no tension on the edges. I specialize in protective styles that keep your natural hair healthy. Home service available in VI and Lekki.',
    skills: ['Hair Stylist'],
    area: 'Victoria Island',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  // Emeka - Plumber & Tiler
  {
    id: 'f5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f9a',
    user_id: USER_IDS.emeka,
    media_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
    media_type: 'photo',
    caption: 'Complete bathroom renovation finished today in Ikeja GRA. New toilet, shower, tiles from floor to ceiling. No leaks guaranteed! From demolition to final polish, I handle everything.',
    skills: ['Plumber', 'Tiler'],
    area: 'Ikeja',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  {
    id: 'f6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f9a0b',
    user_id: USER_IDS.emeka,
    media_url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800',
    media_type: 'photo',
    caption: 'Kitchen sink and water heater installation done. Proper PVC piping, no shortcuts. If your tap is dripping or you need new plumbing work, call me. Same day service for emergencies!',
    skills: ['Plumber'],
    area: 'Ikeja',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  // Fatima - Tailor & Fashion Designer
  {
    id: 'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f9a0b1c',
    user_id: USER_IDS.fatima,
    media_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800',
    media_type: 'photo',
    caption: 'Custom agbada set completed for a client. Hand-embroidered details, perfect fit. Traditional Nigerian wear with modern touches. DM for orders - I work with ankara, lace, and aso-oke.',
    skills: ['Tailor', 'Fashion Designer'],
    area: 'Surulere',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  {
    id: 'f8b9c0d1-e2f3-4a4b-5c6d-7e8f9a0b1c2d',
    user_id: USER_IDS.fatima,
    media_url: 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    media_type: 'photo',
    caption: 'Aso-ebi for a wedding party - 15 pieces delivered on time! I specialize in group orders for owambe. Consistent quality across all pieces. Book 3 weeks in advance for large orders.',
    skills: ['Tailor'],
    area: 'Surulere',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  // Kunle - Auto Mechanic & Panel Beater
  {
    id: 'f9c0d1e2-f3a4-4b5c-6d7e-8f9a0b1c2d3e',
    user_id: USER_IDS.kunle,
    media_url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800',
    media_type: 'photo',
    caption: 'Toyota Camry engine overhaul completed. This car came in knocking badly - now it runs smooth like butter! Full timing belt replacement, new gaskets, and oil change. I specialize in Toyota and Honda.',
    skills: ['Auto Mechanic'],
    area: 'Yaba',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
  {
    id: 'fad1e2f3-a4b5-4c6d-7e8f-9a0b1c2d3e4f',
    user_id: USER_IDS.kunle,
    media_url: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800',
    media_type: 'photo',
    caption: 'Panel beating and spray painting done on this Honda Accord. Accident damage completely fixed - you cannot even tell! Full body work, primer, and factory-match paint. Bring your damaged car, I will restore it.',
    skills: ['Panel Beater'],
    area: 'Yaba',
    view_count: 0,
    share_count: 0,
    endorsement_count: 0,
    trending_score: 0,
  },
];

async function seedDatabase() {
  console.log('Starting database seed...\n');

  // Insert users
  console.log('Inserting users...');
  for (const user of seedUsers) {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'id' });

    if (error) {
      console.log(`Error inserting user ${user.name}:`, error.message);
    } else {
      console.log(`✓ Created user: ${user.name} (${user.skills.join(', ')}) - ${user.area}`);
    }
  }

  console.log('\nInserting posts...');
  for (const post of seedPosts) {
    const { error } = await supabase
      .from('posts')
      .upsert(post, { onConflict: 'id' });

    if (error) {
      console.log(`Error inserting post ${post.id}:`, error.message);
    } else {
      const user = seedUsers.find(u => u.id === post.user_id);
      console.log(`✓ Created post for ${user?.name}: "${post.caption.substring(0, 50)}..."`);
    }
  }

  console.log('\n✅ Seed completed!');
  console.log(`Created ${seedUsers.length} users and ${seedPosts.length} posts`);
}

seedDatabase().catch(console.error);
