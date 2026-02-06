# HustleWall OTP Authentication with Supabase & BestBulkSMS

## Overview

This document explains the complete OTP (One-Time Password) authentication system for HustleWall, integrating Supabase for backend management and BestBulkSMS for SMS delivery.

## Architecture

```
Frontend (React Native)
  ↓
OTP Service (src/lib/otp-service.ts)
  ↓
Supabase Functions (PostgreSQL)
  ├─ generate_otp()
  ├─ verify_otp()
  └─ check_otp_rate_limit()
  ↓
BestBulkSMS API (sendOTP via HTTP)
  ↓
Nigerian SMS Networks (MTN, Airtel, Glo, 9mobile)
```

## Database Schema

### OTP Codes Table
```sql
otp_codes (
  id UUID PRIMARY KEY,
  phone_number TEXT,           -- User's phone number (+2348012345678)
  otp_code TEXT,              -- 6-digit code
  expires_at TIMESTAMP,        -- Expires in 5 minutes
  used BOOLEAN,                -- Marked true after verification
  used_at TIMESTAMP,
  created_at TIMESTAMP
)
```

### OTP Request Logs Table
```sql
otp_request_logs (
  id UUID PRIMARY KEY,
  phone_number TEXT,           -- For rate limiting
  request_count INTEGER,       -- 3 requests per hour
  window_start TIMESTAMP,      -- When the hour started
  last_request_at TIMESTAMP
)
```

### SMS Delivery Logs Table
```sql
sms_delivery_logs (
  id UUID PRIMARY KEY,
  phone_number TEXT,
  otp_id UUID,                 -- Reference to otp_codes
  message TEXT,
  status TEXT,                 -- pending, sent, failed, delivered
  error_message TEXT,
  bestbulksms_response JSONB,  -- API response for debugging
  created_at TIMESTAMP
)
```

## Setup Instructions

### 1. Create Supabase Schema

Run the SQL from `supabase-otp-schema.sql`:
- Creates `otp_codes`, `otp_request_logs`, `sms_delivery_logs` tables
- Creates PostgreSQL functions: `generate_otp()`, `verify_otp()`, `check_otp_rate_limit()`
- Sets up Row Level Security (RLS) policies

```bash
# In Supabase Dashboard → SQL Editor:
# 1. New Query
# 2. Copy entire supabase-otp-schema.sql
# 3. Run
```

### 2. Add BestBulkSMS API Credentials

In Vibecode **ENV** tab, add:
```
EXPO_PUBLIC_BESTBULKSMS_API_KEY=your_api_key_from_bestbulksms
EXPO_PUBLIC_BESTBULKSMS_SENDER_ID=HustleWall    # Optional (displays as sender)
```

Get your API key from:
1. Sign up at https://www.bestbulksms.com
2. Go to API Settings
3. Copy your API key
4. Add to Vibecode ENV

### 3. Ensure Supabase is Configured

Your Supabase env variables should already be set from previous setup:
```
EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## How It Works

### User Flow

```
User enters phone number (08012345678)
  ↓
Click "Send OTP"
  ↓
normalize_phone() → +2348012345678
  ↓
generate_otp() → Creates random 6-digit code, stores in Supabase
  ↓
sendOTPSMS() → Calls BestBulkSMS API with message
  ↓
SMS sent to user's phone
  ↓
User receives SMS: "Your HustleWall OTP is 123456. Expires in 5 minutes."
  ↓
User enters OTP code (123456)
  ↓
Click "Verify"
  ↓
verify_otp() → Checks code, not expired, not used
  ↓
OTP marked as used
  ↓
User logged in, profile created if new
```

## Frontend Components

### 1. OTPPhoneInput (`src/components/OTPPhoneInput.tsx`)

Screen for entering phone number and requesting OTP.

**Features:**
- Phone number input with +234 prefix
- Carrier detection (MTN, Airtel, Glo, 9mobile)
- Quick format buttons for common formats
- Error and success messages
- Loading state with animation

**Props:**
```typescript
interface OTPPhoneInputProps {
  onPhoneVerified: (phoneNumber: string) => void;  // Called when OTP sent
}
```

**Usage:**
```tsx
import OTPPhoneInput from '@/components/OTPPhoneInput';

<OTPPhoneInput onPhoneVerified={(phone) => {
  // Move to OTP verification screen
}} />
```

### 2. OTPCodeInput (`src/components/OTPCodeInput.tsx`)

Screen for entering and verifying OTP code.

**Features:**
- 6-digit code input with auto-submission
- Countdown timer (5 minutes)
- Expired OTP handling
- Manual verify button
- Error and success messages

**Props:**
```typescript
interface OTPCodeInputProps {
  phoneNumber: string;                           // Phone to verify
  onVerified: (phoneNumber: string) => void;     // Called on success
  onBackPress: () => void;                       // Back to phone input
}
```

**Usage:**
```tsx
import OTPCodeInput from '@/components/OTPCodeInput';

<OTPCodeInput
  phoneNumber="+2348012345678"
  onVerified={(phone) => {
    // User verified, log them in
  }}
  onBackPress={() => {
    // User wants to change phone number
  }}
/>
```

## Backend Services

### OTP Service (`src/lib/otp-service.ts`)

Main service for OTP operations.

#### `sendOTP(request: SendOTPRequest)`
Generates OTP and sends via SMS.

```typescript
const result = await sendOTP({
  phone_number: '08012345678'
});

if (result.success) {
  console.log('OTP sent!', result.expires_at);
} else {
  console.log('Error:', result.error);
}
```

**Returns:**
```typescript
{
  success: boolean;
  message?: string;           // "OTP sent to your phone..."
  error?: string;             // Error description
  expires_at?: string;        // ISO timestamp
  remaining_requests?: number; // 0-2
}
```

#### `verifyOTP(request: VerifyOTPRequest)`
Verifies OTP code from user.

```typescript
const result = await verifyOTP({
  phone_number: '08012345678',
  otp_code: '123456'
});

if (result.success) {
  // User is now verified, log them in
  await getOrCreateUserFromPhone('08012345678');
}
```

**Returns:**
```typescript
{
  success: boolean;
  message?: string;   // "OTP verified successfully"
  error?: string;     // "Invalid OTP", "Expired", etc
}
```

#### `getOrCreateUserFromPhone(phoneNumber: string)`
Gets existing user or creates new one after OTP verification.

```typescript
const result = await getOrCreateUserFromPhone('+2348012345678');

if (result.success) {
  const user = result.user;           // User object from DB
  const isNewUser = result.isNewUser; // Boolean

  if (isNewUser) {
    // Direct user to profile setup
  } else {
    // Log in existing user
  }
}
```

### BestBulkSMS Service (`src/lib/bestbulksms.ts`)

Handles SMS delivery via BestBulkSMS API.

#### `sendOTPSMS(phoneNumber: string, otpCode: string)`
Sends formatted OTP SMS.

```typescript
const result = await sendOTPSMS('+2348012345678', '123456');

if (result.success) {
  console.log('SMS sent!');
} else {
  console.log('SMS failed:', result.error);
}
```

#### `normalizePhoneNumber(phone: string)`
Converts various phone formats to international format.

```typescript
normalizePhoneNumber('08012345678')     // → +2348012345678
normalizePhoneNumber('2348012345678')   // → +2348012345678
normalizePhoneNumber('+2348012345678')  // → +2348012345678
normalizePhoneNumber('invalid')         // → null
```

#### `detectNigerianCarrier(phone: string)`
Detects user's carrier from phone prefix.

```typescript
detectNigerianCarrier('08012345678') // → 'MTN'
detectNigerianCarrier('08101234567') // → 'Airtel'
detectNigerianCarrier('07051234567') // → 'Glo'
detectNigerianCarrier('08091234567') // → '9mobile'
```

## Security & Fraud Prevention

### 1. Rate Limiting
- **Limit:** 3 OTP requests per phone number per hour
- **Enforced:** Server-side in `check_otp_rate_limit()` PostgreSQL function
- **Response:** Returns remaining requests count or error

### 2. OTP Expiration
- **Duration:** 5 minutes
- **Enforced:** Server-side in `verify_otp()` function
- **Cleanup:** Old expired OTPs deleted via `cleanup_expired_otps()`

### 3. One-Time Use
- **Rule:** Each OTP can only be used once
- **Enforced:** `used` field marked TRUE after verification
- **Cleanup:** OTPs expire and are deleted after 24 hours

### 4. Server-Side Validation
All fraud prevention happens on Supabase:
- Rate limits checked before generating OTP
- Expiration verified before accepting OTP
- Used flag prevents replay attacks
- Client-side checks are convenience only

### 5. Phone Number Normalization
- All phone numbers stored in international format (+2348012345678)
- Prevents duplicate accounts (e.g., 08012345678 vs 2348012345678)
- Enables proper carrier detection

## Error Handling

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Too many OTP requests" | Sent >3 OTPs in 1 hour | Wait 1 hour or try different number |
| "OTP expired" | 5+ minutes passed | Request new OTP |
| "Invalid OTP code" | Wrong 6-digit code | Check SMS and try again |
| "OTP not found" | Never requested for this number | Request OTP first |
| "BestBulkSMS API key not configured" | Missing ENV variable | Add EXPO_PUBLIC_BESTBULKSMS_API_KEY |

### Demo Mode

If `EXPO_PUBLIC_BESTBULKSMS_API_KEY` is not set, the system runs in **demo mode**:
- OTP is still generated and stored in Supabase
- SMS is NOT sent (no actual charges)
- Console logs the OTP code for testing
- Perfect for development and testing

## Testing Checklist

### 1. Phone Number Input
- [ ] Enter phone number (e.g., 08012345678)
- [ ] Carrier detection works (shows "MTN", "Airtel", etc)
- [ ] Quick format buttons work
- [ ] Invalid numbers show error

### 2. Send OTP
- [ ] Click "Send OTP" button
- [ ] Shows loading state
- [ ] Success message appears
- [ ] Can't send again immediately (rate limit)

### 3. OTP Verification
- [ ] Input screen shows phone number
- [ ] Countdown timer starts (5:00 → 0:00)
- [ ] Typing 6 digits auto-submits or shows verify button
- [ ] Correct code verifies successfully
- [ ] Wrong code shows error
- [ ] Expired OTP shows error

### 4. Rate Limiting
- [ ] Send 3 OTPs quickly
- [ ] 4th OTP shows rate limit error
- [ ] Can send again after 1 hour

### 5. User Creation
- [ ] After OTP verification, user profile created
- [ ] Existing user logs in directly
- [ ] User can edit profile (name, skills, area)

## Production Checklist

Before going live:

- [ ] BestBulkSMS account created with SMS credits
- [ ] API key added to Vibecode ENV tab
- [ ] Database schema created in Supabase
- [ ] RLS policies reviewed and tested
- [ ] Error messages user-friendly
- [ ] SMS delivery working (test with real phone)
- [ ] Rate limiting tested
- [ ] OTP expiration working
- [ ] User creation tested (new + existing)
- [ ] Phone number normalization working
- [ ] Cleanup job set up (delete expired OTPs daily)

## Troubleshooting

### "OTP sent but I didn't receive SMS"
1. Check network signal (LTE/3G needed)
2. Disable DND (Do Not Disturb)
3. Check SMS and promotions folders
4. Try from different number
5. SMS may take 30-60 seconds on busy networks

### "BestBulkSMS credentials not configured"
1. Go to Vibecode ENV tab
2. Add EXPO_PUBLIC_BESTBULKSMS_API_KEY
3. Verify key is correct in BestBulkSMS dashboard
4. Restart app after adding ENV variable

### "Verification failed: Session expired"
1. OTP is valid for only 5 minutes
2. Request a new OTP
3. Or wait and check if it's actually expired

### "Too many OTP requests"
1. You've sent 3+ OTPs to same number in 1 hour
2. Try a different phone number
3. Or wait 1 hour for the window to reset

## API Reference

### BestBulkSMS API

Endpoint: `https://api.bestbulksms.com/api/send`
Method: POST
Content-Type: application/x-www-form-urlencoded

**Request Parameters:**
```
api_key=YOUR_API_KEY
to=+2348012345678
body=Your HustleWall OTP is 123456. Expires in 5 minutes.
from=HustleWall
```

**Success Response:**
```json
{
  "status": "ok",
  "request_id": "123456",
  "balance": 45.50
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Invalid API key"
}
```

## Future Enhancements

1. **WhatsApp OTP Delivery** - Send OTP via WhatsApp instead of SMS
2. **Email OTP** - Alternative delivery method
3. **Biometric Auth** - Fingerprint/Face ID after first OTP
4. **Device Trust** - Skip OTP on trusted devices
5. **SMS Delivery Reports** - Track actual delivery via BestBulkSMS webhooks
6. **Custom OTP Messages** - Branded SMS templates
7. **Internationalization** - Support other countries (e.g., +1, +44)

## Support

For issues:
1. Check LOGS tab in Vibecode
2. Verify BestBulkSMS credentials
3. Test with demo mode first
4. Check database in Supabase
5. Review error messages in components
