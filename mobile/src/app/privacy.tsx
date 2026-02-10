import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 16,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <Text className="text-white text-xl font-bold ml-4">Privacy Policy</Text>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown} className="bg-white rounded-xl p-5">
            <Text className="text-gray-400 text-sm mb-4">
              Last updated: February 2025
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              1. Information We Collect
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We collect the following information:{'\n\n'}
              <Text className="font-semibold">Account Information:</Text> Phone number, name, WhatsApp number, skills, and service area.{'\n\n'}
              <Text className="font-semibold">Content:</Text> Photos, captions, and endorsements you post.{'\n\n'}
              <Text className="font-semibold">Usage Data:</Text> How you interact with the app, including views, shares, and engagement metrics.{'\n\n'}
              <Text className="font-semibold">Device Information:</Text> Device type and identifier for fraud prevention.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              2. How We Use Your Information
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We use your information to:{'\n'}
              • Provide and improve our services{'\n'}
              • Display your profile and posts to other users{'\n'}
              • Calculate engagement metrics and leaderboard rankings{'\n'}
              • Prevent fraud and abuse{'\n'}
              • Send important service notifications{'\n'}
              • Respond to your support requests
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              3. Information Sharing
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              <Text className="font-semibold">Public Information:</Text> Your name, skills, service area, posts, and endorsements are publicly visible to all Zovo users.{'\n\n'}
              <Text className="font-semibold">Contact Information:</Text> Your phone/WhatsApp number is shared only when users choose to contact you.{'\n\n'}
              <Text className="font-semibold">We Do Not:</Text> Sell your personal information to third parties or share it for advertising purposes.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              4. Location Privacy
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We take your location privacy seriously:{'\n'}
              • We never collect or share your precise GPS location{'\n'}
              • Only your broad service area (e.g., "Lekki, Lagos") is shown{'\n'}
              • You choose which area to display on your profile
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              5. Data Security
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We implement appropriate security measures to protect your information,
              including encryption and secure data storage. However, no method of
              transmission over the internet is 100% secure.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              6. Data Retention
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We retain your information as long as your account is active. You can
              request deletion of your account and associated data by contacting us
              at support@zovo.com.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              7. Your Rights
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              You have the right to:{'\n'}
              • Access your personal information{'\n'}
              • Update or correct your information{'\n'}
              • Delete your account{'\n'}
              • Request a copy of your data{'\n'}
              • Opt out of promotional communications
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              8. Children's Privacy
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              Zovo is not intended for users under 18 years of age. We do not
              knowingly collect information from children under 18.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              9. Changes to This Policy
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We may update this privacy policy from time to time. We will notify
              you of significant changes through the app or via your registered
              phone number.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              10. Contact Us
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              For privacy-related questions or requests, contact us at:{'\n'}
              Email: support@zovo.com
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}
