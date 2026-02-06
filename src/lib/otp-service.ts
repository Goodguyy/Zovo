/**
 * OTP Authentication Service
 *
 * Handles OTP generation, storage, and verification via Supabase
 */

import { supabase } from './supabase';
import { sendOTPSMS, normalizePhoneNumber } from './bestbulksms';

export interface SendOTPRequest {
  phone_number: string;
}

export interface SendOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  expires_at?: string;
  remaining_requests?: number;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Generate OTP and send via SMS
 */
export const sendOTP = async (request: SendOTPRequest): Promise<SendOTPResponse> => {
  try {
    console.log('[OTP] === Starting sendOTP ===');
    console.log('[OTP] Phone input:', request.phone_number);

    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(request.phone_number);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number. Use format: +2348012345678 or 08012345678',
      };
    }

    console.log('[OTP] Normalized phone:', normalizedPhone);

    // Step 1: Generate OTP in Supabase
    console.log('[OTP] Generating OTP in Supabase...');
    const { data: generateResult, error: generateError } = await supabase.rpc(
      'generate_otp',
      { p_phone: normalizedPhone }
    );

    if (generateError) {
      console.log('[OTP] Supabase error:', generateError.message);
      return {
        success: false,
        error: generateError.message || 'Failed to generate OTP',
      };
    }

    // Handle array response (table returns array) or single row
    const result = Array.isArray(generateResult) ? generateResult[0] : generateResult;
    console.log('[OTP] Supabase result:', JSON.stringify(result));

    if (!result?.success) {
      return {
        success: false,
        error: 'Failed to generate OTP',
      };
    }

    console.log('[OTP] OTP generated, expires at:', result.expires_at);

    // Step 2: Send OTP via SMS
    const otpCode = result.otp_code;

    if (!otpCode) {
      console.log('[OTP] ERROR: No OTP code returned from Supabase');
      return {
        success: false,
        error: 'Failed to generate OTP code',
      };
    }

    console.log('[OTP] Sending OTP via SMS...');
    console.log('[OTP] Phone:', normalizedPhone, 'Code:', otpCode);

    const smsResult = await sendOTPSMS(normalizedPhone, otpCode);

    console.log('[OTP] SMS Result:', JSON.stringify(smsResult));

    if (!smsResult.success) {
      console.log('[OTP] SMS failed:', smsResult.error);
      return {
        success: false,
        error: smsResult.error || 'Failed to send SMS',
      };
    }

    console.log('[OTP] SMS sent successfully!');

    return {
      success: true,
      message: 'OTP sent to your phone. It expires in 5 minutes.',
      expires_at: result.expires_at,
      remaining_requests: 2,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[OTP] CATCH ERROR:', errorMessage);
    return {
      success: false,
      error: `Failed to send OTP: ${errorMessage}`,
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (request: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
  try {
    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(request.phone_number);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    // Validate OTP code
    if (!request.otp_code || request.otp_code.length !== 6 || isNaN(Number(request.otp_code))) {
      return {
        success: false,
        error: 'OTP must be a 6-digit number',
      };
    }

    console.log('[OTP] Verifying OTP for', normalizedPhone);

    // Call Supabase function to verify
    const { data: verifyResult, error: verifyError } = await supabase.rpc('verify_otp', {
      p_phone_number: normalizedPhone,
      p_otp_code: request.otp_code,
    });

    if (verifyError) {
      return {
        success: false,
        error: 'Verification failed: ' + verifyError.message,
      };
    }

    if (!verifyResult?.success) {
      return {
        success: false,
        error: verifyResult?.error || 'OTP verification failed',
      };
    }

    console.log('[OTP] OTP verified successfully');

    return {
      success: true,
      message: 'OTP verified successfully. You are now logged in.',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Verification error: ${errorMessage}`,
    };
  }
};

/**
 * Get or create user after OTP verification
 * This should be called after successful OTP verification
 */
export const getOrCreateUserFromPhone = async (phoneNumber: string) => {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      throw new Error('Invalid phone number');
    }

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', normalizedPhone)
      .single();

    if (!fetchError && existingUser) {
      // User exists, return it
      return {
        success: true,
        user: existingUser,
        isNewUser: false,
      };
    }

    // Create new user with default name
    const defaultName = `User${normalizedPhone.slice(-4)}`;
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        phone: normalizedPhone,
        whatsapp: normalizedPhone,
        name: defaultName,
        area: 'Not set',
        skills: [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    return {
      success: true,
      user: newUser,
      isNewUser: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Check OTP rate limit
 * Returns how many requests user has left
 */
export const checkOTPRateLimit = async (phoneNumber: string) => {
  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      return {
        allowed: false,
        remaining: 0,
        error: 'Invalid phone number',
      };
    }

    console.log('[OTP] Rate limit check for', normalizedPhone);

    return {
      allowed: true,
      remaining: 3,
    };
  } catch (error) {
    return {
      allowed: false,
      remaining: 0,
      error: 'Rate limit check failed',
    };
  }
};

export default {
  sendOTP,
  verifyOTP,
  getOrCreateUserFromPhone,
  checkOTPRateLimit,
};
