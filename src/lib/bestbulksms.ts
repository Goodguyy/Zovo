/**
 * BestBulkSMS Integration for ZOVO OTP
 *
 * Handles SMS delivery via BestBulkSMS API
 * Routes through Supabase Edge Function to avoid CORS on web
 */

import { supabase } from './supabase';

// Configuration
const BESTBULKSMS_API_KEY = 'c176e532934d12ea1da3d800376a00b116fe08a3908b8e8fd9ce285911fc94e5';
const BESTBULKSMS_API_URL = 'https://www.bestbulksms.com.ng/api/sms/send';
const BESTBULKSMS_SENDER_ID = 'ZOVO';

// Log configuration on startup
console.log('[BestBulkSMS] === Configuration ===');
console.log('[BestBulkSMS] Sender ID:', BESTBULKSMS_SENDER_ID);

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

    const smsPayload = {
      to: phoneNumber,
      message: request.message,
      sender_id: request.sender_id || BESTBULKSMS_SENDER_ID,
      api_key: BESTBULKSMS_API_KEY,
    };

    console.log('[SMS] Sending to:', phoneNumber);
    console.log('[SMS] From:', smsPayload.sender_id);

    // Try to send via Supabase RPC function (works on web)
    console.log('[SMS] Calling Supabase send_sms_via_api function...');

    try {
      const { data, error } = await supabase.rpc('send_sms_via_api', {
        p_to: phoneNumber,
        p_message: request.message,
        p_sender_id: smsPayload.sender_id,
      });

      if (!error && data?.success) {
        console.log('[SMS] SUCCESS via Supabase RPC!');
        return {
          success: true,
          message: 'SMS sent successfully',
          response: data,
        };
      }

      console.log('[SMS] Supabase RPC failed, trying Edge Function...');
    } catch (rpcError) {
      console.log('[SMS] RPC error, trying Edge Function...');
    }

    // Try Edge Function
    try {
      console.log('[SMS] Calling Edge Function send-sms...');
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: phoneNumber,
          body: request.message,
          from: smsPayload.sender_id,
          api_key: BESTBULKSMS_API_KEY,
          api_url: BESTBULKSMS_API_URL,
        },
      });

      console.log('[SMS] Edge Function response - data:', JSON.stringify(data));
      console.log('[SMS] Edge Function response - error:', error ? JSON.stringify(error) : 'none');

      if (error) {
        console.log('[SMS] Edge Function returned error:', error.message);
      } else if (data?.success) {
        console.log('[SMS] SUCCESS via Edge Function!');
        return {
          success: true,
          message: 'SMS sent successfully',
          response: data,
        };
      } else {
        console.log('[SMS] Edge Function returned:', JSON.stringify(data));
        // Check if the SMS API returned a success even if data.success isn't true
        if (data?.status === 'ok') {
          console.log('[SMS] SMS API returned ok status');
          return {
            success: true,
            message: 'SMS sent successfully',
            response: data,
          };
        }
      }

      console.log('[SMS] Edge Function did not succeed, trying direct...');
    } catch (edgeError) {
      console.log('[SMS] Edge Function exception:', edgeError);
    }

    // Fall back to direct API call (works on native/Android)
    return sendSMSDirect(request);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[SMS] Error, trying direct call:', errorMessage);
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

/**
 * Check if API is configured
 */
export const isBestBulkSMSConfigured = (): boolean => {
  return !!BESTBULKSMS_API_KEY;
};

export default {
  sendSMS,
  sendOTPSMS,
  normalizePhoneNumber,
  detectNigerianCarrier,
  isBestBulkSMSConfigured,
};
