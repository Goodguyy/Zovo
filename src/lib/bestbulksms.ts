/**
 * BestBulkSMS Integration for HustleWall OTP
 *
 * Handles SMS delivery via BestBulkSMS API
 * API Docs: https://www.bestbulksms.com/api-documentation
 */

// Configuration - supports multiple variable name formats
const BESTBULKSMS_API_KEY = process.env.EXPO_PUBLIC_BESTBULKSMS_API_KEY || process.env.EXPO_PUBLIC_BULKSMS_API_KEY || '';
const BESTBULKSMS_API_URL = process.env.EXPO_PUBLIC_BULKSMS_API_URL || 'https://www.bestbulksms.com.ng/api/sms/send';
const BESTBULKSMS_SENDER_ID = process.env.EXPO_PUBLIC_BESTBULKSMS_SENDER_ID || process.env.EXPO_PUBLIC_BULKSMS_SENDER_ID || 'ZOVO';

// Log configuration on startup
console.log('[BestBulkSMS] === Configuration ===');
console.log('[BestBulkSMS] API Key configured:', BESTBULKSMS_API_KEY ? `YES (${BESTBULKSMS_API_KEY.substring(0, 8)}...)` : 'NO');
console.log('[BestBulkSMS] API URL:', BESTBULKSMS_API_URL);
console.log('[BestBulkSMS] Sender ID:', BESTBULKSMS_SENDER_ID);

if (!BESTBULKSMS_API_KEY) {
  console.warn(
    'BestBulkSMS API key not configured. OTP will work in demo mode (check LOGS tab for codes).'
  );
}

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
 * Send SMS via BestBulkSMS API
 * @param request Send SMS request object
 * @returns Send SMS response
 */
export const sendSMS = async (request: SendSMSRequest): Promise<SendSMSResponse> => {
  if (!BESTBULKSMS_API_KEY) {
    return {
      success: false,
      error: 'BestBulkSMS API key not configured',
    };
  }

  try {
    // Validate phone number format
    const phoneNumber = normalizePhoneNumber(request.phone_number);
    if (!phoneNumber) {
      return {
        success: false,
        error: 'Invalid phone number format. Expected: +2348012345678',
      };
    }

    // Prepare JSON request body
    const body = {
      to: phoneNumber,
      body: request.message,
      from: request.sender_id || BESTBULKSMS_SENDER_ID,
    };

    console.log(`[SMS] Sending to ${phoneNumber}...`);

    // Make API request with Bearer auth
    const response = await fetch(BESTBULKSMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BESTBULKSMS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    // Check response status
    if (!response.ok || responseData.status !== 'ok') {
      console.log('[SMS] Error response:', responseData);
      return {
        success: false,
        error: responseData.message || 'Failed to send SMS',
        status_code: responseData.status,
        response: responseData,
      };
    }

    console.log('[SMS] Successfully sent to', phoneNumber);
    return {
      success: true,
      message: 'SMS sent successfully',
      request_id: responseData.request_id,
      balance: responseData.balance,
      response: responseData,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log('[SMS] Error sending SMS:', errorMessage);
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
