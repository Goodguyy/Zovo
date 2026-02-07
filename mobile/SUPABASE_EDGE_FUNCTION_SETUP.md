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

**IMPORTANT:** BestBulkSMS API uses `message` and `sender` fields (not `body` and `from`).

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const requestBody = await req.json()

    console.log("[send-sms] Received request for:", requestBody.to)

    const apiKey = requestBody.api_key || Deno.env.get("BESTBULKSMS_API_KEY")
    const apiUrl = requestBody.api_url || "https://www.bestbulksms.com.ng/api/sms/send"

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "SMS API key not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!requestBody.to || !requestBody.body) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing 'to' or 'body' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // BestBulkSMS API uses 'message' and 'sender' fields
    const smsPayload = {
      to: requestBody.to,
      message: requestBody.body,
      sender: requestBody.from || "ZOVO",
    }

    console.log("[send-sms] Sending to BestBulkSMS:", smsPayload.to, "sender:", smsPayload.sender)

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(smsPayload),
    })

    const responseText = await response.text()
    console.log("[send-sms] BestBulkSMS raw response:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.log("[send-sms] Failed to parse response as JSON")
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid response from SMS provider: " + responseText.substring(0, 200),
          raw_response: responseText
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    console.log("[send-sms] BestBulkSMS parsed response:", JSON.stringify(responseData))

    if (responseData.status === "ok" || responseData.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "SMS sent successfully",
          response: responseData,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: responseData.message || responseData.error || "SMS sending failed",
        response: responseData,
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    console.log("[send-sms] Exception:", errorMessage)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
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
