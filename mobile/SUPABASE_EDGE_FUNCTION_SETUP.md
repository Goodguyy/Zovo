# Supabase Edge Function Setup for SMS OTP

This guide explains how to deploy the `send-sms` Edge Function to your Supabase project.

## Why This is Needed

Web browsers block direct API calls to external domains (CORS). The Edge Function acts as a proxy to send SMS via BestBulkSMS.

## Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

## Step 2: Login to Supabase

```bash
supabase login
```

## Step 3: Initialize Supabase in Your Project

```bash
cd /path/to/your/project
supabase init
```

## Step 4: Create the Edge Function

```bash
supabase functions new send-sms
```

## Step 5: Replace the Function Code

Replace the contents of `supabase/functions/send-sms/index.ts` with:

**IMPORTANT:** BestBulkSMS API uses `sender_id` and `message` fields.

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()
    const apiKey = requestBody.api_key || Deno.env.get("BESTBULKSMS_API_KEY")

    if (!apiKey || !requestBody.to || !requestBody.body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const smsPayload = {
      api_key: apiKey,
      to: requestBody.to,
      sender_id: "ZOVO",
      message: requestBody.body,
      type: "plain",
      channel: "generic"
    }

    console.log("[send-sms] Sending to:", requestBody.to)

    const response = await fetch("https://www.bestbulksms.com.ng/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smsPayload)
    })

    const responseText = await response.text()
    console.log("[send-sms] Response:", responseText)

    if (!responseText) {
      return new Response(
        JSON.stringify({ success: false, error: "Empty response from SMS API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const responseData = JSON.parse(responseText)

    if (responseData.ok === true) {
      return new Response(
        JSON.stringify({ success: true, message: "SMS sent", response: responseData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: responseData.error || "SMS failed", response: responseData }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.log("[send-sms] Error:", error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
```

## Step 6: Set Environment Variables (Optional)

You can set the API key as a secret so it doesn't need to be sent from the client:

```bash
supabase secrets set BESTBULKSMS_API_KEY=your_api_key_here
```

## Step 7: Deploy the Function

```bash
supabase functions deploy send-sms --project-ref YOUR_PROJECT_REF
```

Your project ref is: `cfyzrflxkuemgcnfwodx` (from your Supabase URL)

```bash
supabase functions deploy send-sms --project-ref cfyzrflxkuemgcnfwodx
```

## Step 8: Update Database Function

Run this SQL in Supabase SQL Editor to update the `generate_otp` function to return the OTP code:

```sql
-- Drop the old function first
DROP FUNCTION IF EXISTS generate_otp(TEXT);

-- Create new function that returns the OTP code
CREATE OR REPLACE FUNCTION generate_otp(p_phone TEXT)
RETURNS TABLE (
  success BOOLEAN,
  otp_code TEXT,
  otp_id UUID,
  message TEXT,
  expires_at TEXT,
  error TEXT
) AS $$
DECLARE
  v_otp_code TEXT;
  v_otp_id UUID;
  v_rate_limit JSON;
BEGIN
  SELECT check_otp_rate_limit(p_phone) INTO v_rate_limit;

  IF NOT (v_rate_limit->>'allowed')::BOOLEAN THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::UUID, NULL::TEXT, NULL::TEXT, (v_rate_limit->>'error')::TEXT;
    RETURN;
  END IF;

  v_otp_code := LPAD((random() * 999999)::INTEGER::TEXT, 6, '0');

  DELETE FROM otp_codes WHERE phone_number = p_phone AND used = FALSE;

  INSERT INTO otp_codes (phone_number, otp_code, expires_at)
  VALUES (p_phone, v_otp_code, NOW() + INTERVAL '5 minutes')
  RETURNING id INTO v_otp_id;

  RETURN QUERY SELECT TRUE, v_otp_code, v_otp_id, 'OTP generated'::TEXT, (NOW() + INTERVAL '5 minutes')::TEXT, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing

After deployment, test the function:

```bash
curl -X POST 'https://cfyzrflxkuemgcnfwodx.supabase.co/functions/v1/send-sms' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"to": "+2348012345678", "body": "Test message", "api_key": "YOUR_BESTBULKSMS_KEY"}'
```

## Summary

1. Update the `generate_otp` SQL function (Step 8)
2. Deploy the Edge Function (Steps 3-7)
3. The app will automatically use the Edge Function on web
