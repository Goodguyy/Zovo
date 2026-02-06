import React, { useState, useRef } from 'react';
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
import { Phone, ArrowRight, AlertCircle } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { sendOTP } from '@/lib/otp-service';
import { normalizePhoneNumber, detectNigerianCarrier } from '@/lib/bestbulksms';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

interface OTPPhoneInputProps {
  onPhoneVerified: (phoneNumber: string) => void;
}

export default function OTPPhoneInput({ onPhoneVerified }: OTPPhoneInputProps) {
  const insets = useSafeAreaInsets();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const carrier = phoneNumber ? detectNigerianCarrier(phoneNumber) : '';
  const isValidPhone = !!normalizedPhone;

  const handlePhoneChange = (text: string) => {
    setError('');
    setSuccess(false);
    setPhoneNumber(text);
  };

  const handleSendOTP = async () => {
    if (!isValidPhone) {
      setError('Please enter a valid Nigerian phone number');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await sendOTP({ phone_number: phoneNumber });

      if (result.success) {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Pass to next screen after 1 second
        setTimeout(() => {
          onPhoneVerified(normalizedPhone!);
        }, 1000);
      } else {
        setError(result.error || 'Failed to send OTP');
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

  const handleQuickFormat = (format: string) => {
    setPhoneNumber(format);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
            <View className="flex-row items-center gap-2 mb-2">
              <Phone size={28} color="#fff" />
              <Text className="text-white text-2xl font-bold">Verify Your Phone</Text>
            </View>
            <Text className="text-white/80 text-sm">
              We'll send you a one-time password via SMS
            </Text>
          </Animated.View>
        </LinearGradient>

        <View className="flex-1 px-4 pt-8">
          {/* Illustration */}
          <Animated.View entering={FadeInDown.delay(100)} className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center">
              <Phone size={40} color="#059669" />
            </View>
          </Animated.View>

          {/* Phone Input */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
            <Text className="text-gray-900 font-semibold text-sm mb-2">
              Nigerian Phone Number
            </Text>
            <View
              className={cn(
                'border-2 rounded-lg px-4 py-3 flex-row items-center',
                error
                  ? 'border-red-300 bg-red-50'
                  : success
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-200 bg-white'
              )}
            >
              <Text className="text-gray-500 font-semibold mr-2">+234</Text>
              <TextInput
                ref={phoneInputRef}
                value={phoneNumber.replace(/^\+234/, '').replace(/^0/, '')}
                onChangeText={(text) => {
                  // Format as: 08012345678 or 2348012345678
                  const cleaned = text.replace(/\D/g, '');
                  if (cleaned.length <= 10) {
                    handlePhoneChange('0' + cleaned);
                  } else if (cleaned.length <= 12) {
                    handlePhoneChange(cleaned);
                  }
                }}
                placeholder="8012345678"
                placeholderTextColor="#d1d5db"
                keyboardType="phone-pad"
                editable={!loading}
                className="flex-1 text-gray-900 font-semibold text-base"
              />
              {success && <Text className="text-green-600">✓</Text>}
            </View>
            {carrier && (
              <Text className="text-gray-500 text-xs mt-2">
                Detected carrier: {carrier}
              </Text>
            )}
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
                ✓ OTP sent! Redirecting...
              </Text>
            </Animated.View>
          )}

          {/* Quick Format Buttons */}
          <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
            <Text className="text-gray-600 text-xs font-semibold mb-2">QUICK FORMAT</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => handleQuickFormat('08012345678')}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 items-center"
              >
                <Text className="text-gray-700 text-xs font-medium">08012345678</Text>
              </Pressable>
              <Pressable
                onPress={() => handleQuickFormat('2348012345678')}
                className="flex-1 border border-gray-200 rounded-lg py-2.5 items-center"
              >
                <Text className="text-gray-700 text-xs font-medium">2348012345678</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Send OTP Button */}
          <Animated.View entering={FadeInDown.delay(400)}>
            <Pressable
              onPress={handleSendOTP}
              disabled={!isValidPhone || loading}
              className={cn(
                'rounded-lg py-4 flex-row items-center justify-center gap-2',
                isValidPhone && !loading
                  ? 'bg-emerald-600 active:bg-emerald-700'
                  : 'bg-gray-300'
              )}
            >
              {loading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white font-bold text-lg">Sending...</Text>
                </>
              ) : (
                <>
                  <Text className="text-white font-bold text-lg">Send OTP</Text>
                  <ArrowRight size={20} color="#fff" />
                </>
              )}
            </Pressable>
          </Animated.View>

          {/* Info Card */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            className="mt-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <Text className="text-blue-900 font-semibold text-sm mb-2">
              About OTP Authentication
            </Text>
            <Text className="text-blue-800 text-xs leading-5">
              • You'll receive a 6-digit code via SMS{'\n'}
              • The code expires in 5 minutes{'\n'}
              • Available on all Nigerian networks{'\n'}
              • Free authentication, no data required
            </Text>
          </Animated.View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
