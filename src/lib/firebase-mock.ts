// Firebase Phone Auth - Mock Implementation for Development
// Replace with real Firebase when deploying to production
//
// To enable real Firebase:
// 1. Go to the ENV tab in Vibecode and add:
//    - EXPO_PUBLIC_FIREBASE_API_KEY
//    - EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
//    - EXPO_PUBLIC_FIREBASE_PROJECT_ID
//    - EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
//    - EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
//    - EXPO_PUBLIC_FIREBASE_APP_ID
// 2. After publishing, install @react-native-firebase/app and @react-native-firebase/auth

export interface MockUser {
  uid: string;
  phoneNumber: string;
}

export interface ConfirmationResult {
  confirm: (code: string) => Promise<{ user: MockUser }>;
}

// Simulated OTP verification
// In development: any 6-digit code works, or use "123456" for guaranteed success
// In production: Firebase handles real SMS verification

let pendingVerification: {
  phoneNumber: string;
  verificationId: string;
  sentAt: number;
} | null = null;

// Check if real Firebase would be configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
  );
};

// Simulate sending OTP
export const sendOTP = async (phoneNumber: string): Promise<{ verificationId: string }> => {
  // Simulate network delay (Nigerian networks can be slow)
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Validate phone number format
  const cleanNumber = phoneNumber.replace(/\s/g, '');
  if (!cleanNumber.match(/^\+234[0-9]{10}$/)) {
    throw new Error('Invalid Nigerian phone number. Format: +234XXXXXXXXXX');
  }

  // Simulate occasional network failures (5% chance)
  if (Math.random() < 0.05) {
    throw new Error('Network error. Please check your connection and try again.');
  }

  // Generate a mock verification ID
  const verificationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  pendingVerification = {
    phoneNumber: cleanNumber,
    verificationId,
    sentAt: Date.now(),
  };

  console.log(`[DEV] OTP sent to ${cleanNumber}. Use code: 123456 (or any 6 digits)`);

  return { verificationId };
};

// Simulate verifying OTP
export const verifyOTP = async (
  verificationId: string,
  code: string
): Promise<{ user: MockUser }> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 500));

  // Check if verification exists
  if (!pendingVerification || pendingVerification.verificationId !== verificationId) {
    throw new Error('Verification session expired. Please request a new code.');
  }

  // Check if OTP expired (5 minutes)
  const OTP_EXPIRY_MS = 5 * 60 * 1000;
  if (Date.now() - pendingVerification.sentAt > OTP_EXPIRY_MS) {
    pendingVerification = null;
    throw new Error('Code expired. Please request a new one.');
  }

  // Validate code format
  if (!code.match(/^[0-9]{6}$/)) {
    throw new Error('Please enter a valid 6-digit code.');
  }

  // In dev mode, accept "123456" or any 6-digit code
  // In production, Firebase validates against actual SMS code
  const isValidCode = code === '123456' || code.length === 6;

  if (!isValidCode) {
    throw new Error('Incorrect code. Please try again.');
  }

  // Generate a mock user
  const user: MockUser = {
    uid: `user_${pendingVerification.phoneNumber.replace(/\+/g, '')}`,
    phoneNumber: pendingVerification.phoneNumber,
  };

  // Clear pending verification
  const phoneNumber = pendingVerification.phoneNumber;
  pendingVerification = null;

  console.log(`[DEV] User verified: ${phoneNumber}`);

  return { user };
};

// Simulate sign out
export const signOut = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 300));
  pendingVerification = null;
  console.log('[DEV] User signed out');
};

// Error codes matching Firebase for easy migration
export const AuthErrorCodes = {
  INVALID_PHONE_NUMBER: 'auth/invalid-phone-number',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  CODE_EXPIRED: 'auth/code-expired',
  INVALID_CODE: 'auth/invalid-verification-code',
  SESSION_EXPIRED: 'auth/session-expired',
  NETWORK_ERROR: 'auth/network-request-failed',
};

// Helper to format phone number for Nigerian users
export const formatNigerianPhone = (input: string): string => {
  // Remove all non-digits
  const digits = input.replace(/\D/g, '');

  // Handle different input formats
  if (digits.startsWith('234') && digits.length === 13) {
    return `+${digits}`;
  } else if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  } else if (digits.length === 10 && !digits.startsWith('0')) {
    return `+234${digits}`;
  }

  // Return with +234 prefix if no country code
  if (!digits.startsWith('234')) {
    return `+234${digits}`;
  }

  return `+${digits}`;
};

// Validate Nigerian phone number
export const isValidNigerianPhone = (phone: string): boolean => {
  const formatted = formatNigerianPhone(phone);
  // Nigerian numbers: +234 followed by 10 digits
  // Valid prefixes: 70x, 80x, 81x, 90x, 91x (MTN, Glo, Airtel, 9mobile)
  return /^\+234[789][01][0-9]{8}$/.test(formatted);
};

// Get carrier from phone number (for UX hints)
export const getCarrierHint = (phone: string): string | null => {
  const formatted = formatNigerianPhone(phone);
  const prefix = formatted.slice(4, 7);

  const carriers: Record<string, string[]> = {
    MTN: ['703', '706', '803', '806', '810', '813', '814', '816', '903', '906', '913', '916'],
    Glo: ['705', '805', '807', '811', '815', '905', '915'],
    Airtel: ['701', '708', '802', '808', '812', '902', '907', '912'],
    '9mobile': ['809', '817', '818', '909', '908'],
  };

  for (const [carrier, prefixes] of Object.entries(carriers)) {
    if (prefixes.includes(prefix)) {
      return carrier;
    }
  }

  return null;
};
