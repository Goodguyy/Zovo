import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  HelpCircle,
  MessageSquare,
  ChevronRight,
  LogOut,
  ExternalLink,
  FileText,
  Flag,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/cn';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, danger }: SettingItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-4 active:bg-gray-50"
    >
      <View
        className={cn(
          "w-10 h-10 rounded-full items-center justify-center",
          danger ? "bg-red-100" : "bg-emerald-100"
        )}
      >
        {icon}
      </View>
      <View className="flex-1 ml-3">
        <Text
          className={cn(
            "font-medium",
            danger ? "text-red-600" : "text-gray-900"
          )}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-gray-500 text-sm mt-0.5">{subtitle}</Text>
        )}
      </View>
      <ChevronRight size={18} color={danger ? "#dc2626" : "#9ca3af"} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAppStore((s) => s.currentUser);
  const logout = useAppStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@zovo.com');
  };

  const handleHelp = () => {
    Alert.alert(
      'Zovo Help',
      'Zovo connects informal workers with customers through proof-of-work posts.\n\n• Post photos of your completed work\n• Add skill tags and your service area\n• Get endorsements from satisfied customers\n• Customers can contact you via WhatsApp or phone\n\nFor more help, contact support@zovo.com'
    );
  };

  const handlePrivacy = () => {
    Alert.alert(
      'Privacy & Safety',
      'Zovo is designed with your safety in mind:\n\n• We never share your precise location\n• Only your broad service area is shown\n• Your phone number is only shared when you choose to receive calls\n• Endorsements are traceable to build trust\n\nAlways meet new customers in public places and agree on payment terms before starting work.'
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
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
            <Text className="text-white text-xl font-bold ml-4">Settings</Text>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile section */}
          {currentUser && (
            <Animated.View
              entering={FadeInDown.delay(0)}
              className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
            >
              <Pressable
                onPress={() => router.push(`/profile/${currentUser.id}`)}
                className="flex-row items-center p-4 active:bg-gray-50"
              >
                <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center">
                  <Text className="text-emerald-700 font-bold text-xl">
                    {currentUser.name.charAt(0)}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold text-lg">
                    {currentUser.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {currentUser.phone}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </Pressable>
            </Animated.View>
          )}

          {/* Account settings */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
          >
            <Text className="text-gray-500 text-xs font-medium uppercase px-4 pt-4 pb-2">
              Account
            </Text>
            <SettingItem
              icon={<User size={20} color="#059669" />}
              title="Edit Profile"
              subtitle="Update your name, skills, and area"
              onPress={() => router.push('/edit-profile')}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingItem
              icon={<Bell size={20} color="#059669" />}
              title="Notifications"
              subtitle="Manage your notification preferences"
              onPress={() => {
                Alert.alert('Coming Soon', 'Notification settings will be available in the next update.');
              }}
            />
          </Animated.View>

          {/* Safety & Help */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
          >
            <Text className="text-gray-500 text-xs font-medium uppercase px-4 pt-4 pb-2">
              Safety & Help
            </Text>
            <SettingItem
              icon={<Shield size={20} color="#059669" />}
              title="Privacy Policy"
              subtitle="How we protect your information"
              onPress={() => router.push('/privacy')}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingItem
              icon={<FileText size={20} color="#059669" />}
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => router.push('/terms')}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingItem
              icon={<HelpCircle size={20} color="#059669" />}
              title="Help & FAQ"
              subtitle="Get answers to common questions"
              onPress={handleHelp}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingItem
              icon={<MessageSquare size={20} color="#059669" />}
              title="Contact Support"
              subtitle="Report issues or get help"
              onPress={handleContact}
            />
          </Animated.View>

          {/* About */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
          >
            <Text className="text-gray-500 text-xs font-medium uppercase px-4 pt-4 pb-2">
              About
            </Text>
            <View className="px-4 py-4">
              <Text className="text-gray-900 font-semibold">Zovo</Text>
              <Text className="text-gray-500 text-sm mt-1">Version 1.0.0</Text>
              <Text className="text-gray-400 text-xs mt-3 leading-5">
                Zovo connects skilled informal workers with customers
                through proof-of-work posts. Built for the Nigerian market with
                zero capital required.
              </Text>
            </View>
          </Animated.View>

          {/* Logout */}
          {currentUser && (
            <Animated.View
              entering={FadeInDown.delay(400)}
              className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
            >
              <SettingItem
                icon={<LogOut size={20} color="#dc2626" />}
                title="Log Out"
                onPress={handleLogout}
                danger
              />
            </Animated.View>
          )}

          {/* Footer */}
          <View className="items-center mt-6 px-4">
            <Text className="text-gray-400 text-xs text-center">
              Made with love for Nigerian hustlers by Zovo
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
