import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Lock, ArrowRight, AlertCircle, Clock } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { verifyOTP } from '@/lib/otp-service';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

interface OTPCodeInputProps {
  phoneNumber: string;
  onVerified: (phoneNumber: string) => void;
  onBackPress: () => void;
}

export default function OTPCodeInput({ phoneNumber, onVerified, onBackPress }: OTPCodeInputProps) {
  const insets = useSafeAreaInsets();
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const otpInputRef = useRef<TextInput>(null);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError('OTP expired. Please request a new one.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isExpired = timeRemaining === 0;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOTPChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/\D/g, '').slice(0, 6);
    setOtpCode(cleaned);
    setError('');

    // Auto-submit when 6 digits entered
    if (cleaned.length === 6) {
      handleVerifyOTP(cleaned);
    }
  };

  const handleVerifyOTP = async (code: string = otpCode) => {
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    if (isExpired) {
      setError('OTP expired. Please request a new one.');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP({
        phone_number: phoneNumber,
        otp_code: code,
      });

      if (result.success) {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Pass to next screen after 1 second
        setTimeout(() => {
          onVerified(phoneNumber);
        }, 1000);
      } else {
        setError(result.error || 'Verification failed');
        setOtpCode('');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-gradient-to-b from-emerald-50 to-gray-50">
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 16,
            paddingBottom: 24,
            paddingHorizontal: 16,
          }}
        >
          <Animated.View entering={FadeInUp}>
            <Pressable onPress={onBackPress} className="mb-4">
              <Text className="text-white font-semibold">← Change phone number</Text>
            </Pressable>
            <View className="flex-row items-center gap-2 mb-2">
              <Lock size={28} color="#fff" />
              <Text className="text-white text-2xl font-bold">Enter OTP Code</Text>
            </View>
            <Text className="text-white/80 text-sm">
              We sent a code to {phoneNumber}
            </Text>
          </Animated.View>
        </LinearGradient>

        <View className="flex-1 px-4 pt-8">
          {/* Illustration */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center">
              <Lock size={40} color="#059669" />
            </View>
          </Animated.View>

          {/* Timer */}
          <Animated.View entering={FadeInDown.delay(150)} className="items-center mb-6">
            <View
              className={cn(
                'flex-row items-center gap-2 px-4 py-2 rounded-full',
                isExpired ? 'bg-red-100' : 'bg-amber-100'
              )}
            >
              <Clock size={18} color={isExpired ? '#dc2626' : '#b45309'} />
              <Text
                className={cn(
                  'font-semibold',
                  isExpired ? 'text-red-700' : 'text-amber-900'
                )}
              >
                {isExpired ? 'Expired' : formatTime(timeRemaining)}
              </Text>
            </View>
          </Animated.View>

          {/* OTP Input */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Text className="text-gray-900 font-semibold text-sm mb-2">
              6-Digit Code
            </Text>
            <View
              className={cn(
                'border-2 rounded-lg px-4 py-3',
                error
                  ? 'border-red-300 bg-red-50'
                  : success
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <TextInput
                ref={otpInputRef}
                value={otpCode}
                onChangeText={handleOTPChange}
                placeholder="000000"
                placeholderTextColor="#d1d5db"
                keyboardType="number-pad"
                editable={!loading && !success && !isExpired}
                maxLength={6}
                className="text-gray-900 font-bold text-4xl text-center tracking-widest"
              />
            </View>
            <Text className="text-gray-500 text-xs mt-2 text-center">
              Code will auto-submit when complete
            </Text>
          </Animated.View>

          {/* Error Message */}
          {error && (
            <Animated.View entering={FadeInDown} className="flex-row gap-2 mb-4 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={18} color="#ef4444" />
              <Text className="text-red-700 text-sm flex-1">{error}</Text>
            </Animated.View>
          )}

          {/* Success Message */}
          {success && (
            <Animated.View entering={FadeInDown} className="flex-row gap-2 mb-4 bg-green-50 p-3 rounded-lg">
              <Text className="text-green-700 text-sm flex-1">
                ✓ Code verified! Creating your profile...
              </Text>
            </Animated.View>
          )}

          {/* Manual Verify Button */}
          {otpCode.length === 6 && !loading && !success && (
            <Animated.View entering={FadeInDown.delay(300)}>
              <Pressable
                onPress={() => handleVerifyOTP()}
                className="rounded-lg py-4 flex-row items-center justify-center gap-2 bg-emerald-600 active:bg-emerald-700"
              >
                <Text className="text-white font-bold text-lg">Verify Code</Text>
                <ArrowRight size={20} color="#fff" />
              </Pressable>
            </Animated.View>
          )}

          {/* Info Card */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            className="mt-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <Text className="text-blue-900 font-semibold text-sm mb-2">
              Didn't receive the code?
            </Text>
            <Text className="text-blue-800 text-xs leading-5">
              • Check SMS or promotions folder{'\n'}
              • Ensure DND is not enabled on your phone{'\n'}
              • SMS takes 30-60 seconds to arrive{'\n'}
              • Tap back and request a new code
            </Text>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
