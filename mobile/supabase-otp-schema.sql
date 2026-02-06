-- HustleWall OTP Authentication Schema
-- Add this to your Supabase database

-- =====================================================
-- OTP CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_otp_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_created_at ON otp_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_phone_unused ON otp_codes(phone_number) WHERE used = FALSE;

-- =====================================================
-- OTP REQUEST HISTORY TABLE
-- For rate limiting: max 3 requests per hour per phone
-- =====================================================
CREATE TABLE IF NOT EXISTS otp_request_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  last_request_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(phone_number)
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_phone ON otp_request_logs(phone_number);

-- =====================================================
-- SMS DELIVERY LOGS TABLE
-- For tracking delivery status and debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS sms_delivery_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT NOT NULL,
  otp_id UUID REFERENCES otp_codes(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, sent, failed, delivered
  error_message TEXT,
  bestbulksms_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_delivery_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_status ON sms_delivery_logs(status);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check rate limit (3 OTP requests per hour)
CREATE OR REPLACE FUNCTION check_otp_rate_limit(p_phone_number TEXT)
RETURNS JSON AS $$
DECLARE
  current_count INTEGER;
  window_time TIMESTAMPTZ;
BEGIN
  SELECT request_count, window_start INTO current_count, window_time
  FROM otp_request_logs
  WHERE phone_number = p_phone_number;

  -- If no record or window expired (>1 hour), reset
  IF window_time IS NULL OR (NOW() - window_time) > INTERVAL '1 hour' THEN
    INSERT INTO otp_request_logs (phone_number, request_count, window_start, last_request_at)
    VALUES (p_phone_number, 1, NOW(), NOW())
    ON CONFLICT (phone_number)
    DO UPDATE SET request_count = 1, window_start = NOW(), last_request_at = NOW();

    RETURN json_build_object('allowed', true, 'remaining', 2);
  END IF;

  -- Check if limit exceeded
  IF current_count >= 3 THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'Too many OTP requests. Try again in 1 hour.',
      'remaining', 0
    );
  END IF;

  -- Increment count
  UPDATE otp_request_logs
  SET request_count = request_count + 1, last_request_at = NOW()
  WHERE phone_number = p_phone_number;

  RETURN json_build_object(
    'allowed', true,
    'remaining', 3 - (current_count + 1)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to generate and store OTP
CREATE OR REPLACE FUNCTION generate_otp(p_phone_number TEXT)
RETURNS JSON AS $$
DECLARE
  v_otp_code TEXT;
  v_otp_id UUID;
  v_rate_limit JSON;
BEGIN
  -- Check rate limit first
  SELECT check_otp_rate_limit(p_phone_number) INTO v_rate_limit;

  IF NOT (v_rate_limit->>'allowed')::BOOLEAN THEN
    RETURN json_build_object(
      'success', false,
      'error', v_rate_limit->>'error'
    );
  END IF;

  -- Generate random 6-digit OTP
  v_otp_code := LPAD((random() * 999999)::INTEGER::TEXT, 6, '0');

  -- Delete any existing unused OTPs for this number
  DELETE FROM otp_codes
  WHERE phone_number = p_phone_number AND used = FALSE;

  -- Insert new OTP (expires in 5 minutes)
  INSERT INTO otp_codes (phone_number, otp_code, expires_at)
  VALUES (p_phone_number, v_otp_code, NOW() + INTERVAL '5 minutes')
  RETURNING id INTO v_otp_id;

  RETURN json_build_object(
    'success', true,
    'otp_id', v_otp_id,
    'message', 'OTP generated successfully',
    'expires_at', (NOW() + INTERVAL '5 minutes')::TEXT
  );
END;
$$ LANGUAGE plpgsql;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(p_phone_number TEXT, p_otp_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_otp_record RECORD;
BEGIN
  -- Find the OTP record
  SELECT id, otp_code, expires_at, used
  INTO v_otp_record
  FROM otp_codes
  WHERE phone_number = p_phone_number
    AND used = FALSE
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists
  IF v_otp_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No OTP found for this phone number. Request a new one.'
    );
  END IF;

  -- Check if OTP is expired
  IF NOW() > v_otp_record.expires_at THEN
    RETURN json_build_object(
      'success', false,
      'error', 'OTP has expired. Request a new one.'
    );
  END IF;

  -- Check if OTP code matches (secure comparison)
  IF v_otp_record.otp_code != p_otp_code THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid OTP code.'
    );
  END IF;

  -- Mark OTP as used
  UPDATE otp_codes
  SET used = TRUE, used_at = NOW(), updated_at = NOW()
  WHERE id = v_otp_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'OTP verified successfully',
    'phone_number', p_phone_number
  );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otp_codes
  WHERE expires_at < NOW() AND used = FALSE;

  -- Also cleanup old used OTPs (keep for 24 hours for logs)
  DELETE FROM otp_codes
  WHERE used = TRUE AND used_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- EDGE FUNCTION PLACEHOLDERS
-- These will be replaced with actual Edge Functions
-- =====================================================

/*
CREATE OR REPLACE FUNCTION send_otp_via_sms(p_phone_number TEXT)
RETURNS JSON AS $$
BEGIN
  -- This should call an Edge Function or external API
  -- For now, we'll return a placeholder
  RETURN json_build_object(
    'success', false,
    'error', 'This function should be called via Edge Function'
  );
END;
$$ LANGUAGE plpgsql;
*/

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_delivery_logs ENABLE ROW LEVEL SECURITY;

-- OTP codes: Only system can read/write (via RPC)
CREATE POLICY "System access to OTP codes" ON otp_codes
  USING (FALSE);  -- Disable direct access, use functions only

-- Request logs: Only system access
CREATE POLICY "System access to OTP logs" ON otp_request_logs
  USING (FALSE);

-- SMS logs: Only system access
CREATE POLICY "System access to SMS logs" ON sms_delivery_logs
  USING (FALSE);
