/**
 * BestBulkSMS Integration for ZOVO OTP
 *
 * Handles SMS delivery via BestBulkSMS API
 * Routes through Supabase Edge Function to avoid CORS on web
 */

import { supabase } from './supabase';
import { Platform } from 'react-native';

// Configuration from environment variables
const BESTBULKSMS_API_KEY = process.env.EXPO_PUBLIC_BESTBULKSMS_API_KEY || '';
const BESTBULKSMS_API_URL = process.env.EXPO_PUBLIC_BULKSMS_API_URL || 'https://www.bestbulksms.com.ng/api/sms/send';
const BESTBULKSMS_SENDER_ID = 'ZOVO';

// Log configuration on startup
console.log('[BestBulkSMS] === Configuration ===');
console.log('[BestBulkSMS] Sender ID:', BESTBULKSMS_SENDER_ID);
console.log('[BestBulkSMS] API Key configured:', !!BESTBULKSMS_API_KEY);
console.log('[BestBulkSMS] Platform:', Platform.OS);

// Types
export interface SendSMSRequest {
  phone_number: string;
  message: string;
  sender_id?: string;
}

export interface SendSMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  request_id?: string;
  balance?: number;
  status_code?: string;
  response?: any;
}

export interface BestBulkSMSErrorResponse {
  code: string;
  message: string;
}

/**
 * Send SMS via Supabase Edge Function (avoids CORS issues on web)
 * Falls back to direct API call on native
 */
export const sendSMS = async (request: SendSMSRequest): Promise<SendSMSResponse> => {
  console.log('[SMS] === sendSMS called ===');
  console.log('[SMS] Request:', JSON.stringify(request));
  console.log('[SMS] Platform:', Platform.OS);

  try {
    // Validate phone number format
    const phoneNumber = normalizePhoneNumber(request.phone_number);
    if (!phoneNumber) {
      console.log('[SMS] ERROR: Invalid phone number');
      return {
        success: false,
        error: 'Invalid phone number format. Expected: +2348012345678',
      };
    }

    console.log('[SMS] Sending to:', phoneNumber);
    console.log('[SMS] From:', request.sender_id || BESTBULKSMS_SENDER_ID);

    // On web, we MUST use Edge Function due to CORS
    // On native, try Edge Function first, then fall back to direct

    // Try Edge Function first (works on all platforms)
    try {
      console.log('[SMS] Calling Edge Function send-sms...');

      if (!supabase) {
        console.log('[SMS] ERROR: Supabase client not initialized');
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: phoneNumber,
          body: request.message,
          from: request.sender_id || BESTBULKSMS_SENDER_ID,
          api_key: BESTBULKSMS_API_KEY,
          api_url: BESTBULKSMS_API_URL,
        },
      });

      console.log('[SMS] Edge Function response - data:', JSON.stringify(data));
      console.log('[SMS] Edge Function response - error:', error ? JSON.stringify(error) : 'none');

      if (error) {
        console.log('[SMS] Edge Function returned error:', error.message);
        throw new Error(error.message || 'Edge Function error');
      }

      if (data?.success) {
        console.log('[SMS] SUCCESS via Edge Function!');
        return {
          success: true,
          message: 'SMS sent successfully',
          response: data,
        };
      }

      // Check if the SMS API returned a success even if data.success isn't true
      if (data?.status === 'ok') {
        console.log('[SMS] SMS API returned ok status');
        return {
          success: true,
          message: 'SMS sent successfully',
          response: data,
        };
      }

      // Edge function returned but SMS failed
      console.log('[SMS] Edge Function returned failure:', JSON.stringify(data));

      // On web, we can't fall back to direct call, so return the error
      if (Platform.OS === 'web') {
        return {
          success: false,
          error: data?.error || 'SMS sending failed via Edge Function',
          response: data,
        };
      }

      // On native, try direct call
      throw new Error(data?.error || 'Edge Function did not succeed');
    } catch (edgeError) {
      console.log('[SMS] Edge Function exception:', edgeError);

      // On web, we can't fall back to direct API due to CORS
      if (Platform.OS === 'web') {
        const errorMessage = edgeError instanceof Error ? edgeError.message : 'Edge Function failed';
        return {
          success: false,
          error: `SMS sending failed: ${errorMessage}. Please check Edge Function deployment.`,
        };
      }
    }

    // Fall back to direct API call (only works on native/Android/iOS)
    console.log('[SMS] Falling back to direct API call (native only)...');
    return sendSMSDirect(request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[SMS] Error:', errorMessage);

    // On web, don't try direct call
    if (Platform.OS === 'web') {
      return {
        success: false,
        error: `SMS sending failed: ${errorMessage}`,
      };
    }

    return sendSMSDirect(request);
  }
};

/**
 * Direct SMS API call (works on native apps, blocked by CORS on web)
 */
const sendSMSDirect = async (request: SendSMSRequest): Promise<SendSMSResponse> => {
  console.log('[SMS] Attempting direct API call...');

  try {
    const phoneNumber = normalizePhoneNumber(request.phone_number);
    if (!phoneNumber) {
      return {
        success: false,
        error: 'Invalid phone number format',
      };
    }

    const body = {
      to: phoneNumber,
      body: request.message,
      from: request.sender_id || BESTBULKSMS_SENDER_ID,
    };

    console.log('[SMS] Direct call to:', BESTBULKSMS_API_URL);

    const response = await fetch(BESTBULKSMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BESTBULKSMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[SMS] Direct response status:', response.status);
    const responseData = await response.json();
    console.log('[SMS] Direct response data:', JSON.stringify(responseData));

    if (!response.ok || responseData.status !== 'ok') {
      return {
        success: false,
        error: responseData.message || 'Failed to send SMS',
        status_code: responseData.status,
        response: responseData,
      };
    }

    console.log('[SMS] SUCCESS! SMS sent directly');
    return {
      success: true,
      message: 'SMS sent successfully',
      request_id: responseData.request_id,
      balance: responseData.balance,
      response: responseData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[SMS] Direct call FAILED:', errorMessage);
    return {
      success: false,
      error: `SMS sending failed: ${errorMessage}`,
    };
  }
};

/**
 * Send OTP SMS to user
 * Formatted message: "Your HustleWall OTP is {{OTP}}. Expires in 5 minutes."
 */
export const sendOTPSMS = async (
  phoneNumber: string,
  otpCode: string
): Promise<SendSMSResponse> => {
  const message = `Your ZOVO OTP is ${otpCode}. Expires in 5 minutes. Do not share this code.`;

  return sendSMS({
    phone_number: phoneNumber,
    message: message,
    sender_id: 'ZOVO',
  });
};

/**
 * Normalize phone number to international format
 * Accepts:
 * - +2348012345678 (already normalized)
 * - 08012345678 (Nigerian format with leading 0)
 * - 8012345678 (10 digits without leading 0)
 * - 2348012345678 (without +)
 */
export const normalizePhoneNumber = (phone: string): string | null => {
  // Remove all non-numeric characters except +
  let normalized = phone.replace(/[^\d+]/g, '');

  // Handle Nigerian phone numbers
  if (normalized.startsWith('+234') && normalized.length === 14) {
    // Already in correct format
    return normalized;
  } else if (normalized.startsWith('+234') && normalized.length === 13) {
    // +234 followed by 9 digits - missing one digit
    return null;
  } else if (normalized.startsWith('0') && normalized.length === 11) {
    // 08012345678 → +2348012345678
    normalized = '+234' + normalized.substring(1);
  } else if (normalized.startsWith('234') && normalized.length === 13) {
    // 2348012345678 → +2348012345678
    normalized = '+' + normalized;
  } else if (normalized.length === 10 && /^[789]/.test(normalized)) {
    // 8012345678 → +2348012345678 (10 digits starting with 7, 8, or 9)
    normalized = '+234' + normalized;
  } else if (normalized.startsWith('+') && normalized.length === 14) {
    // Already has + and correct length
    return normalized;
  } else {
    return null;
  }

  // Validate final length (should be 14 chars: +234XXXXXXXXXX)
  if (normalized.length !== 14) {
    return null;
  }

  return normalized;
};

/**
 * Detect carrier from phone number
 * Used for UX feedback
 */
export const detectNigerianCarrier = (phoneNumber: string): string => {
  const normalized = normalizePhoneNumber(phoneNumber) || phoneNumber;
  const prefix = normalized.substring(4, 7); // Get XXX from +234XXXXXXXXXXX

  // MTN prefixes
  if (['703', '706', '803', '806', '810', '813', '814', '816', '904'].includes(prefix)) {
    return 'MTN';
  }

  // Airtel prefixes
  if (['701', '708', '802', '808', '812', '815', '901'].includes(prefix)) {
    return 'Airtel';
  }

  // GLO prefixes
  if (['705', '807', '811', '905'].includes(prefix)) {
    return 'Glo';
  }

  // 9mobile prefixes
  if (['809', '817', '818', '909'].includes(prefix)) {
    return '9mobile';
  }

  return 'Unknown';
};

export default {
  sendSMS,
  sendOTPSMS,
  normalizePhoneNumber,
  detectNigerianCarrier,
};
