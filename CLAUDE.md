# Project-Wide Instructions

## Supabase Configuration

**IMPORTANT: This project uses Supabase for ALL backend services. Do NOT use the local SQLite/Prisma database or Better Auth.**

### Use Supabase For:
1. **Database** - Use Supabase PostgreSQL for all data storage, not the local SQLite database
2. **Authentication** - Use Supabase Auth for all sign-in, sign-up, password reset, and session management
3. **Email Verification** - Use Supabase Auth email verification, not custom solutions
4. **Phone/SMS Verification** - Use Supabase Auth phone verification when needed
5. **OAuth/Social Login** - Configure through Supabase Auth (Google, Apple, etc.)
6. **Row Level Security (RLS)** - Implement RLS policies in Supabase for data security
7. **Real-time** - Use Supabase Realtime for live data updates when needed
8. **Storage** - Use Supabase Storage for file uploads (images, documents, etc.)

### Environment Variables
The following Supabase credentials are configured:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key for client-side access

### Implementation Guidelines

#### Frontend (Mobile App)
```typescript
// Create a Supabase client in src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

#### Authentication Examples
```typescript
// Sign up with email
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in with email
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
});
```

#### Database Examples
```typescript
// Fetch data
const { data, error } = await supabase
  .from('table_name')
  .select('*');

// Insert data
const { data, error } = await supabase
  .from('table_name')
  .insert({ column: 'value' });

// Update data
const { data, error } = await supabase
  .from('table_name')
  .update({ column: 'new_value' })
  .eq('id', 1);

// Delete data
const { error } = await supabase
  .from('table_name')
  .delete()
  .eq('id', 1);
```

### DO NOT Use:
- Local SQLite database (`/backend/prisma/dev.db`)
- Prisma ORM for database operations
- Better Auth for authentication
- Custom email verification systems
- Local file storage for user uploads

### When User Asks For:
- "Add login/signup" → Use Supabase Auth
- "Save user data" → Use Supabase Database
- "Store files/images" → Use Supabase Storage
- "Real-time updates" → Use Supabase Realtime
- "Email verification" → Use Supabase Auth email confirmation
- "Password reset" → Use Supabase Auth password recovery
- "Social login" → Configure OAuth in Supabase Dashboard

### Database Schema Changes
When the user needs new tables or schema changes:
1. Direct them to the Supabase Dashboard to create/modify tables
2. Or use Supabase migrations if they prefer code-based schema management
3. Always enable Row Level Security (RLS) on tables containing user data
