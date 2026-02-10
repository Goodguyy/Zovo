import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function TermsScreen() {
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
            <Text className="text-white text-xl font-bold ml-4">Terms of Service</Text>
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
              1. Acceptance of Terms
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              By accessing or using Zovo, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              2. Description of Service
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              Zovo is a platform that connects informal workers (service providers) with
              potential customers through proof-of-work posts. We do not employ the workers
              listed on our platform, nor do we guarantee the quality of their work.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              3. User Accounts
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              You must provide accurate and complete information when creating an account.
              You are responsible for maintaining the confidentiality of your account and
              for all activities that occur under your account.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              4. User Content
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              You are solely responsible for the content you post on Zovo, including photos,
              captions, and endorsements. Content must be accurate, not misleading, and must
              not violate any laws or third-party rights.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              5. Prohibited Conduct
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              You agree not to:{'\n'}
              • Post false or misleading information{'\n'}
              • Impersonate others or create fake accounts{'\n'}
              • Harass, abuse, or harm other users{'\n'}
              • Use the platform for illegal activities{'\n'}
              • Attempt to manipulate engagement metrics{'\n'}
              • Scrape or collect user data without permission
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              6. Transactions Between Users
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              Zovo does not process payments or mediate transactions between users.
              All agreements, payments, and disputes are solely between the service
              provider and the customer. We are not responsible for the quality,
              safety, or legality of services offered.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              7. Safety
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We encourage users to take reasonable precautions when meeting others
              through our platform. Always meet in public places, verify credentials
              independently, and agree on terms before work begins.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              8. Termination
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              We reserve the right to suspend or terminate your account at any time,
              with or without notice, for violating these terms or for any other reason
              at our discretion.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              9. Disclaimers
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              Zovo is provided "as is" without warranties of any kind. We do not verify
              the identity, skills, or qualifications of users. Use of the platform is
              at your own risk.
            </Text>

            <Text className="text-gray-900 font-bold text-lg mb-3">
              10. Contact
            </Text>
            <Text className="text-gray-600 text-sm leading-6 mb-4">
              For questions about these terms, contact us at support@zovo.com
            </Text>
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}
