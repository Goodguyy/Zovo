# OTP Authentication Quick Start

## 5-Minute Setup

### Step 1: Create Supabase Tables (2 min)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Open `supabase-otp-schema.sql` from your workspace
4. Copy ALL contents
5. Paste into SQL editor
6. Click **Run**
7. Wait for ✓ success (should see green checkmark)

### Step 2: Get BestBulkSMS API Key (2 min)

1. Go to https://www.bestbulksms.com
2. Sign up (free account)
3. Go to **Dashboard** → **API Settings** or **Developer**
4. Copy your **API Key**
5. Go to Vibecode **ENV** tab
6. Add: `EXPO_PUBLIC_BESTBULKSMS_API_KEY=your_key_here`
7. Save

**Optional (Sender ID):**
```
EXPO_PUBLIC_BESTBULKSMS_SENDER_ID=HustleWall
```

### Step 3: Test (1 min)

**Demo Mode (No SMS charges):**
1. DON'T add API key yet, or just skip for now
2. Open app → Auth screen
3. Enter: `08012345678`
4. Click "Send OTP"
5. Check LOGS tab in Vibecode
6. You'll see OTP code in logs (e.g., `[OTP DEMO] OTP code: 123456`)
7. Use that code in verification screen
8. ✓ Done!

**Production Mode (With Real SMS):**
1. Add `EXPO_PUBLIC_BESTBULKSMS_API_KEY` from Step 2
2. Restart app
3. Enter your real Nigerian phone number
4. Click "Send OTP"
5. Receive SMS on your phone
6. Enter code
7. User created!

## Files You Need to Know

| File | Purpose |
|------|---------|
| `supabase-otp-schema.sql` | Database tables & functions |
| `src/lib/bestbulksms.ts` | SMS API integration |
| `src/lib/otp-service.ts` | OTP business logic |
| `src/components/OTPPhoneInput.tsx` | Phone input screen |
| `src/components/OTPCodeInput.tsx` | Code verification screen |
| `OTP_AUTHENTICATION.md` | Full documentation |

## What Happens When User Signs Up

```
User taps "Sign Up"
  ↓
Enters phone: 08012345678
  ↓
Taps "Send OTP"
  ↓
App sends to Supabase: "Generate OTP for +2348012345678"
  ↓
Supabase creates 6-digit code (e.g., 427519)
  ↓
App calls BestBulkSMS API
  ↓
BestBulkSMS sends SMS to +2348012345678
  ↓
User receives: "Your HustleWall OTP is 427519. Expires in 5 minutes."
  ↓
User enters 427519
  ↓
App verifies with Supabase
  ↓
Supabase checks: not used? not expired? matches?
  ↓
All good → marks as used
  ↓
App creates user profile
  ↓
User logged in!
```

## Common Issues & Fixes

| Problem | Fix |
|---------|-----|
| "Credentials not configured" | Add API key to Vibecode ENV tab |
| "SMS not received" | Check DND is off, wait 30-60 seconds |
| "OTP keeps saying invalid" | Make sure it's a fresh 6-digit code |
| "Can't send OTP (rate limit)" | Wait 1 hour after 3 attempts |
| "OTP expired" | Should only happen after 5+ min, request new |
| "No error, just nothing happens" | Check LOGS tab, might be stuck |

## Database Tables Explanation

**otp_codes:**
- Stores generated 6-digit codes
- Expires after 5 minutes
- Marked "used" after verification
- Deleted after 24 hours

**otp_request_logs:**
- Tracks how many times each number requested OTP
- Resets every hour
- Prevents abuse (max 3 per hour)

**sms_delivery_logs:**
- Tracks all SMS sent
- Status: pending, sent, failed
- For debugging SMS issues

## Environment Variables

```bash
# Required for SMS sending
EXPO_PUBLIC_BESTBULKSMS_API_KEY=your_key

# Optional (defaults to "HustleWall")
EXPO_PUBLIC_BESTBULKSMS_SENDER_ID=MyCustomName

# Already configured from earlier setup
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Testing Scenarios

### Test 1: Demo Mode
```
1. Don't add API key
2. App runs in demo mode
3. OTP shown in logs
4. No real SMS sent
5. Perfect for development
```

### Test 2: Real SMS
```
1. Add real API key
2. Use real Nigerian phone number
3. Receive real SMS
4. Verify code works
5. User created in Supabase
```

### Test 3: Rate Limiting
```
1. Send OTP 3 times to same number
2. 4th attempt: "Too many requests"
3. Shows remaining requests
4. Works as expected
```

### Test 4: Expiration
```
1. Send OTP
2. Wait 5+ minutes
3. Try to verify
4. Shows: "OTP expired"
5. Must request new OTP
```

## Security Features Included

✓ 6-digit random codes
✓ 5-minute expiration
✓ One-time use only
✓ Rate limiting (3/hour)
✓ Server-side validation
✓ Phone number normalization
✓ Device fingerprinting ready
✓ All fraud prevention server-side

## When You're Ready for Production

1. Test with real SMS (Step 2 above)
2. Have BestBulkSMS account with SMS credits
3. Monitor Supabase tables for activity
4. Check LOGS for any errors
5. Deploy app via Vibecode
6. Success! 🎉

## Helpful Resources

- **BestBulkSMS Docs**: https://www.bestbulksms.com/api-documentation
- **Supabase Docs**: https://supabase.com/docs
- **OTP Full Guide**: See `OTP_AUTHENTICATION.md`
- **Implementation Details**: See `OTP_IMPLEMENTATION_SUMMARY.md`

## Support

**Something broken?**
1. Check LOGS tab in Vibecode
2. Check BestBulkSMS credentials in ENV
3. Check Supabase Dashboard (SQL Editor)
4. Review error messages in component
5. Read `OTP_AUTHENTICATION.md` troubleshooting section

**Need to integrate with existing auth?**
- Replace firebase-mock calls with otp-service calls
- Or use OTPPhoneInput and OTPCodeInput components directly
- See `OTP_AUTHENTICATION.md` for integration examples

## That's It!

You now have production-grade OTP authentication with:
- Real SMS delivery
- Rate limiting
- Expiration
- User creation
- Beautiful UI
- Complete documentation

Ship it! 🚀
