import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Phone,
  User,
  MapPin,
  Briefcase,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInUp, FadeOut } from 'react-native-reanimated';
import { useAppStore, NIGERIAN_AREAS, SKILL_TAGS, generateId } from '@/lib/store';
import { sendOTP, verifyOTP } from '@/lib/otp-service';
import { createProfile, getProfileByPhone } from '@/lib/services/supabaseService';
import { normalizePhoneNumber, detectNigerianCarrier, isBestBulkSMSConfigured } from '@/lib/bestbulksms';
import { cn } from '@/lib/cn';

type Step = 'phone' | 'otp' | 'profile';

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
}

export default function AuthScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const login = useAppStore((s) => s.login);

  // Flow state
  const [step, setStep] = useState<Step>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  // Phone input
  const [phone, setPhone] = useState('');
  const [carrierHint, setCarrierHint] = useState<string | null>(null);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

  // Profile state
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Verified user data
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [verifiedUid, setVerifiedUid] = useState<string | null>(null);

  // Helper function to format phone number for Nigerian users
  const formatNigerianPhone = (input: string): string => {
    const digits = input.replace(/\D/g, '');

    // If user entered just the local part (e.g., 8123456789 or 08123456789)
    if (digits.startsWith('0') && digits.length === 11) {
      return `+234${digits.slice(1)}`;
    }
    // If user entered without leading 0 (e.g., 8123456789)
    if (digits.length === 10) {
      return `+234${digits}`;
    }
    // If already has 234 prefix
    if (digits.startsWith('234') && digits.length === 13) {
      return `+${digits}`;
    }
    // For shorter inputs, assume it's the local number part
    if (digits.length < 11 && !digits.startsWith('234')) {
      return `+234${digits}`;
    }

    return `+234${digits}`;
  };

  // Validate Nigerian phone number
  const isValidNigerianPhone = (phone: string): boolean => {
    const formatted = formatNigerianPhone(phone);
    // Nigerian numbers: +234 followed by 10 digits starting with 7, 8, or 9
    return /^\+234[789][0-9]{9}$/.test(formatted);
  };

  // Update carrier hint as user types
  useEffect(() => {
    if (phone.length >= 4) {
      const formatted = formatNigerianPhone(phone);
      setCarrierHint(detectNigerianCarrier(formatted));
    } else {
      setCarrierHint(null);
    }
  }, [phone]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSendOTP = async () => {
    setError(null);
    const formattedPhone = formatNigerianPhone(phone);

    if (!isValidNigerianPhone(phone)) {
      setError({
        message: 'Please enter a valid Nigerian phone number',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendOTP({ phone_number: formattedPhone });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send OTP');
      }

      setVerificationId(formattedPhone); // Use phone as verification ID
      setVerifiedPhone(formattedPhone);
      setWhatsapp(formattedPhone);
      setResendTimer(30);
      setStep('otp');

      // Show demo mode hint if BestBulkSMS isn't configured
      if (!isBestBulkSMSConfigured()) {
        setError({
          message: 'Demo mode: Enter any 6 digits or use 123456',
          type: 'info',
        });
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to send OTP. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/[^0-9]/g, '').slice(-1);

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5 && newOtp.every((d) => d !== '')) {
      handleVerifyOTP(newOtp.join(''));
    }
  };

  const handleOTPKeyPress = (index: number, key: string) => {
    // Handle backspace
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (code?: string) => {
    setError(null);
    const otpCode = code || otp.join('');

    if (otpCode.length !== 6) {
      setError({
        message: 'Please enter all 6 digits',
        type: 'error',
      });
      return;
    }

    if (!verifiedPhone) {
      setError({
        message: 'Session expired. Please request a new code.',
        type: 'error',
      });
      setStep('phone');
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyOTP({ phone_number: verifiedPhone, otp_code: otpCode });

      if (!result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      // Generate a user ID from phone number
      const generatedUid = `user_${verifiedPhone.replace(/\+/g, '')}`;
      setVerifiedUid(generatedUid);

      // Check if user already has a profile
      const existingProfile = await getProfileByPhone(verifiedPhone);

      if (existingProfile) {
        // Existing user - log them in
        login({
          id: existingProfile.id,
          phone: existingProfile.phone,
          name: existingProfile.name,
          whatsapp: existingProfile.whatsapp,
          skills: existingProfile.skills,
          area: existingProfile.area,
          createdAt: existingProfile.created_at,
          endorsementCount: existingProfile.total_endorsements,
        });
        router.replace('/(tabs)');
      } else {
        // New user - collect profile info
        setStep('profile');
      }
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Verification failed. Please try again.',
        type: 'error',
      });
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0 || !verifiedPhone) return;

    setError(null);
    setIsLoading(true);
    setOtp(['', '', '', '', '', '']);

    try {
      const result = await sendOTP({ phone_number: verifiedPhone });

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      setResendTimer(30);
      setError({
        message: 'New code sent!',
        type: 'info',
      });
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to resend. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 3) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleCreateProfile = async () => {
    setError(null);

    if (!name.trim()) {
      setError({ message: 'Please enter your name', type: 'error' });
      return;
    }

    if (selectedSkills.length === 0) {
      setError({ message: 'Please select at least one skill', type: 'error' });
      return;
    }

    if (!selectedArea) {
      setError({ message: 'Please select your service area', type: 'error' });
      return;
    }

    if (!verifiedPhone) {
      setError({ message: 'Session expired. Please start over.', type: 'error' });
      setStep('phone');
      return;
    }

    setIsLoading(true);

    try {
      const profileData = {
        id: verifiedUid || generateId(),
        phone: verifiedPhone,
        name: name.trim(),
        whatsapp: whatsapp || verifiedPhone,
        skills: selectedSkills,
        area: selectedArea,
      };

      const result = await createProfile(profileData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create profile');
      }

      // Login with the local profile format
      login({
        id: profileData.id,
        phone: profileData.phone,
        name: profileData.name,
        whatsapp: profileData.whatsapp,
        skills: profileData.skills,
        area: profileData.area,
        createdAt: new Date().toISOString(),
        endorsementCount: 0,
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to create profile. Please try again.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Error banner component
  const ErrorBanner = () => {
    if (!error) return null;

    const bgColor =
      error.type === 'error'
        ? 'bg-red-50'
        : error.type === 'warning'
        ? 'bg-amber-50'
        : 'bg-blue-50';
    const textColor =
      error.type === 'error'
        ? 'text-red-700'
        : error.type === 'warning'
        ? 'text-amber-700'
        : 'text-blue-700';
    const iconColor =
      error.type === 'error' ? '#dc2626' : error.type === 'warning' ? '#d97706' : '#2563eb';

    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        className={cn('rounded-xl p-4 mb-4 flex-row items-center', bgColor)}
      >
        <AlertCircle size={20} color={iconColor} />
        <Text className={cn('flex-1 ml-3 text-sm', textColor)}>{error.message}</Text>
        <Pressable onPress={() => setError(null)}>
          <X size={18} color={iconColor} />
        </Pressable>
      </Animated.View>
    );
  };

  const renderPhoneStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">Enter your phone</Text>
      <Text className="text-gray-500 mb-6">We'll send you a verification code via SMS</Text>

      <ErrorBanner />

      <View className="bg-white rounded-xl p-4 flex-row items-center mb-4">
        <View className="bg-emerald-100 rounded-lg px-3 py-2.5 mr-3">
          <Text className="text-emerald-700 font-semibold">+234</Text>
        </View>
        <TextInput
          value={phone}
          onChangeText={(text) => setPhone(text.replace(/[^0-9]/g, ''))}
          placeholder="812 345 6789"
          keyboardType="phone-pad"
          className="flex-1 text-gray-900 text-lg"
          placeholderTextColor="#9ca3af"
          maxLength={11}
          editable={!isLoading}
        />
        {carrierHint && (
          <View className="bg-gray-100 rounded-full px-2 py-1">
            <Text className="text-gray-500 text-xs">{carrierHint}</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={handleSendOTP}
        disabled={phone.length < 10 || isLoading}
        className={cn(
          'rounded-xl py-4 items-center flex-row justify-center',
          phone.length >= 10 && !isLoading ? 'bg-emerald-500 active:bg-emerald-600' : 'bg-gray-300'
        )}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text
              className={cn(
                'font-bold text-lg',
                phone.length >= 10 ? 'text-white' : 'text-gray-500'
              )}
            >
              Send Code
            </Text>
          </>
        )}
      </Pressable>

      <Text className="text-gray-400 text-xs text-center mt-4">
        By continuing, you agree to our Terms of Service.{'\n'}
        Standard SMS rates may apply.
      </Text>

      {/* Network tips */}
      <View className="mt-6 bg-gray-50 rounded-xl p-4">
        <Text className="text-gray-700 font-medium mb-2">Tips for receiving SMS:</Text>
        <Text className="text-gray-500 text-sm leading-5">
          • Ensure you have network signal{'\n'}
          • Check that your number is not on DND{'\n'}
          • SMS may take up to 60 seconds on busy networks
        </Text>
      </View>
    </Animated.View>
  );

  const renderOTPStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">Enter verification code</Text>
      <Text className="text-gray-500 mb-6">
        Sent to {verifiedPhone}
      </Text>

      <ErrorBanner />

      {/* OTP Input boxes */}
      <View className="flex-row justify-between mb-6">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => {
              otpInputRefs.current[index] = ref;
            }}
            value={digit}
            onChangeText={(text) => handleOTPChange(index, text)}
            onKeyPress={({ nativeEvent }) => handleOTPKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={1}
            className={cn(
              'w-12 h-14 bg-white rounded-xl text-center text-2xl font-bold',
              digit ? 'border-2 border-emerald-500 text-gray-900' : 'border border-gray-200 text-gray-400'
            )}
            editable={!isLoading}
            selectTextOnFocus
          />
        ))}
      </View>

      <Pressable
        onPress={() => handleVerifyOTP()}
        disabled={otp.some((d) => !d) || isLoading}
        className={cn(
          'rounded-xl py-4 items-center',
          otp.every((d) => d) && !isLoading ? 'bg-emerald-500 active:bg-emerald-600' : 'bg-gray-300'
        )}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text
            className={cn('font-bold text-lg', otp.every((d) => d) ? 'text-white' : 'text-gray-500')}
          >
            Verify
          </Text>
        )}
      </Pressable>

      {/* Resend section */}
      <View className="mt-6 items-center">
        <Text className="text-gray-500 text-sm mb-2">Didn't receive the code?</Text>
        <Pressable
          onPress={handleResendOTP}
          disabled={resendTimer > 0 || isLoading}
          className="flex-row items-center"
        >
          <RefreshCw
            size={16}
            color={resendTimer > 0 ? '#9ca3af' : '#059669'}
          />
          <Text
            className={cn(
              'ml-2 font-medium',
              resendTimer > 0 ? 'text-gray-400' : 'text-emerald-600'
            )}
          >
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
          </Text>
        </Pressable>
      </View>

      {/* Change number */}
      <Pressable
        onPress={() => {
          setStep('phone');
          setOtp(['', '', '', '', '', '']);
          setVerificationId(null);
        }}
        className="mt-4 items-center"
        disabled={isLoading}
      >
        <Text className="text-gray-500">Change phone number</Text>
      </Pressable>
    </Animated.View>
  );

  const renderProfileStep = () => (
    <Animated.View entering={FadeInDown} className="flex-1">
      <Text className="text-gray-900 text-2xl font-bold mb-2">Create your profile</Text>
      <Text className="text-gray-500 mb-6">This will be shown to potential customers</Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ErrorBanner />

        {/* Name */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Your Name *</Text>
          <View className="bg-white rounded-xl p-4 flex-row items-center">
            <User size={20} color="#6b7280" />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Chidi Okonkwo"
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* WhatsApp */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">WhatsApp Number</Text>
          <View className="bg-white rounded-xl p-4 flex-row items-center">
            <Phone size={20} color="#6b7280" />
            <TextInput
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Same as phone if blank"
              keyboardType="phone-pad"
              className="flex-1 ml-3 text-gray-900"
              placeholderTextColor="#9ca3af"
            />
          </View>
          <Text className="text-gray-400 text-xs mt-1">
            Customers will contact you on this number
          </Text>
        </View>

        {/* Skills */}
        <View className="mb-4">
          <Text className="text-gray-900 font-semibold mb-2">Your Skills * (max 3)</Text>
          <Pressable
            onPress={() => setShowSkillPicker(!showSkillPicker)}
            className="bg-white rounded-xl p-4 flex-row items-center justify-between"
          >
            <View className="flex-row flex-wrap gap-2 flex-1">
              {selectedSkills.length > 0 ? (
                selectedSkills.map((skill) => (
                  <View
                    key={skill}
                    className="bg-emerald-100 rounded-full px-3 py-1.5 flex-row items-center"
                  >
                    <Text className="text-emerald-700 text-sm font-medium">{skill}</Text>
                    <Pressable onPress={() => toggleSkill(skill)} className="ml-1.5">
                      <X size={14} color="#047857" />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text className="text-gray-400">Select your skills...</Text>
              )}
            </View>
            <Briefcase size={20} color="#6b7280" />
          </Pressable>

          {showSkillPicker && (
            <Animated.View
              entering={SlideInUp.springify()}
              className="bg-white rounded-xl mt-2 p-4 max-h-48"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-2">
                  {SKILL_TAGS.map((skill) => (
                    <Pressable
                      key={skill}
                      onPress={() => toggleSkill(skill)}
                      disabled={selectedSkills.length >= 3 && !selectedSkills.includes(skill)}
                      className={cn(
                        'px-3 py-2 rounded-full border',
                        selectedSkills.includes(skill)
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-gray-200',
                        selectedSkills.length >= 3 &&
                          !selectedSkills.includes(skill) &&
                          'opacity-40'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          selectedSkills.includes(skill) ? 'text-white' : 'text-gray-700'
                        )}
                      >
                        {skill}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>

        {/* Area */}
        <View className="mb-6">
          <Text className="text-gray-900 font-semibold mb-2">Service Area *</Text>
          <Pressable
            onPress={() => setShowAreaPicker(!showAreaPicker)}
            className="bg-white rounded-xl p-4 flex-row items-center justify-between"
          >
            <Text className={selectedArea ? 'text-gray-900' : 'text-gray-400'}>
              {selectedArea || 'Select your area...'}
            </Text>
            <MapPin size={20} color="#6b7280" />
          </Pressable>

          {showAreaPicker && (
            <Animated.View
              entering={SlideInUp.springify()}
              className="bg-white rounded-xl mt-2 p-4 max-h-48"
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap gap-2">
                  {NIGERIAN_AREAS.map((area) => (
                    <Pressable
                      key={area}
                      onPress={() => {
                        setSelectedArea(area);
                        setShowAreaPicker(false);
                      }}
                      className={cn(
                        'px-3 py-2 rounded-full border',
                        selectedArea === area
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-white border-gray-200'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm font-medium',
                          selectedArea === area ? 'text-white' : 'text-gray-700'
                        )}
                      >
                        {area}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>

        <Pressable
          onPress={handleCreateProfile}
          className="bg-emerald-500 rounded-xl py-4 items-center flex-row justify-center mb-8 active:bg-emerald-600"
        >
          <Check size={20} color="#fff" />
          <Text className="text-white font-bold text-lg ml-2">Create Profile</Text>
        </Pressable>
      </ScrollView>
    </Animated.View>
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 24,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                if (step === 'otp') {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                } else if (step === 'profile') {
                  // Can't go back from profile - user is verified
                  router.back();
                } else {
                  router.back();
                }
              }}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
              disabled={isLoading}
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <View className="ml-4">
              <Text className="text-white text-xl font-bold">
                {step === 'phone' && 'Sign Up'}
                {step === 'otp' && 'Verify Phone'}
                {step === 'profile' && 'Your Profile'}
              </Text>
            </View>
          </View>

          {/* Progress indicator */}
          <View className="flex-row mt-4 gap-2">
            <View
              className={cn(
                'flex-1 h-1 rounded-full',
                step === 'phone' ? 'bg-white' : 'bg-white/40'
              )}
            />
            <View
              className={cn(
                'flex-1 h-1 rounded-full',
                step === 'otp' ? 'bg-white' : 'bg-white/40'
              )}
            />
            <View
              className={cn(
                'flex-1 h-1 rounded-full',
                step === 'profile' ? 'bg-white' : 'bg-white/40'
              )}
            />
          </View>
        </LinearGradient>

        <View className="flex-1 px-4 pt-6">
          {step === 'phone' && renderPhoneStep()}
          {step === 'otp' && renderOTPStep()}
          {step === 'profile' && renderProfileStep()}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
