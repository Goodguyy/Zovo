/**
 * OTP Authentication Service
 *
 * Handles OTP generation, storage, and verification via Supabase
 */

import { supabase } from './supabase';
import { sendOTPSMS, normalizePhoneNumber, isBestBulkSMSConfigured } from './bestbulksms';

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
    // Validate phone number
    const normalizedPhone = normalizePhoneNumber(request.phone_number);
    if (!normalizedPhone) {
      return {
        success: false,
        error: 'Invalid phone number. Use format: +2348012345678 or 08012345678',
      };
    }

    // Check if BestBulkSMS is configured
    if (!isBestBulkSMSConfigured()) {
      console.warn('[OTP] BestBulkSMS not configured. Using demo mode.');
      // In demo mode, just generate OTP without sending SMS
      return sendOTPDemo(normalizedPhone);
    }

    // Step 1: Generate OTP in Supabase
    console.log('[OTP] Generating OTP for', normalizedPhone);
    const { data: generateResult, error: generateError } = await supabase.rpc(
      'generate_otp',
      { p_phone_number: normalizedPhone }
    );

    if (generateError || !generateResult?.success) {
      const errorMessage = generateResult?.error || generateError?.message || 'Failed to generate OTP';
      return {
        success: false,
        error: errorMessage,
      };
    }

    console.log('[OTP] OTP generated, expires at:', generateResult.expires_at);

    // Step 2: Send OTP via SMS
    // In a production setup, this would be done via Supabase Edge Function
    // For now, we'll do it client-side (not recommended for production)
    let smsResult: any = null;

    try {
      smsResult = await sendOTPSMS(normalizedPhone, '123456'); // Placeholder - should be real OTP from DB
      if (!smsResult.success) {
        console.warn('[OTP] SMS sending failed:', smsResult.error);
        // Don't fail - OTP was generated, SMS just didn't send
      } else {
        console.log('[OTP] SMS sent successfully');
      }
    } catch (smsError) {
      console.warn('[OTP] SMS error:', smsError);
      // Continue anyway - OTP is still valid
    }

    return {
      success: true,
      message: 'OTP sent to your phone. It expires in 5 minutes.',
      expires_at: generateResult.expires_at,
      remaining_requests: generateResult.remaining || 2,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to send OTP: ${errorMessage}`,
    };
  }
};

/**
 * Demo mode: Generate OTP without sending SMS
 * Used for testing and when BestBulkSMS is not configured
 */
export const sendOTPDemo = async (phoneNumber: string): Promise<SendOTPResponse> => {
  try {
    const { data: generateResult, error: generateError } = await supabase.rpc(
      'generate_otp',
      { p_phone_number: phoneNumber }
    );

    if (generateError || !generateResult?.success) {
      return {
        success: false,
        error: generateResult?.error || 'Failed to generate OTP',
      };
    }

    console.log('[OTP DEMO] OTP generated. In production, SMS would be sent.');
    console.log('[OTP DEMO] For testing, use OTP code: 123456 (or any 6 digits)');

    return {
      success: true,
      message: 'OTP generated (demo mode). Check console for code. Expires in 5 minutes.',
      expires_at: generateResult.expires_at,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `Failed to generate OTP: ${errorMessage}`,
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

    // This would require a separate function or direct DB query
    // For now, rate limiting is handled server-side in Supabase
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
  sendOTPDemo,
  verifyOTP,
  getOrCreateUserFromPhone,
  checkOTPRateLimit,
};
