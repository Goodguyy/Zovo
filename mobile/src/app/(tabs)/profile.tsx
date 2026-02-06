import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  Settings,
  BadgeCheck,
  MapPin,
  Clock,
  Star,
  ChevronRight,
  LogOut,
  Eye,
  Share2,
  TrendingUp,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useAppStore, formatAccountAge, formatTimeAgo } from '@/lib/store';
import { useEngagementStats } from '@/lib/useEngagement';
import { getUserEndorsementsReceived, subscribeToEngagement, EndorsementRecord } from '@/lib/engagement';
import { useSupabasePosts, useSupabaseProfile, AppPost } from '@/lib/hooks/useSupabaseData';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

export default function ProfileTabScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const logout = useAppStore((s) => s.logout);

  // Fetch user posts from Supabase
  const { posts: userPosts } = useSupabasePosts({ userId: currentUser?.id });

  // Real-time engagement stats
  const engagementStats = useEngagementStats(currentUser?.id ?? '');

  // Get real-time endorsements
  const [userEndorsements, setUserEndorsements] = useState(
    currentUser ? getUserEndorsementsReceived(currentUser.id) : []
  );

  // Subscribe to engagement updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribeToEngagement(() => {
      setUserEndorsements(getUserEndorsementsReceived(currentUser.id));
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Animation for stats
  const viewScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const endorseScale = useSharedValue(1);

  const [prevStats, setPrevStats] = useState(engagementStats);

  useEffect(() => {
    if (engagementStats.totalViews > prevStats.totalViews) {
      viewScale.value = withSequence(withSpring(1.15), withSpring(1));
    }
    if (engagementStats.totalShares > prevStats.totalShares) {
      shareScale.value = withSequence(withSpring(1.15), withSpring(1));
    }
    if (engagementStats.totalEndorsements > prevStats.totalEndorsements) {
      endorseScale.value = withSequence(withSpring(1.15), withSpring(1));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setPrevStats(engagementStats);
  }, [engagementStats, viewScale, shareScale, endorseScale, prevStats]);

  const viewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: viewScale.value }],
  }));

  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

  const endorseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endorseScale.value }],
  }));

  if (!isAuthenticated || !currentUser) {
    return (
      <View className="flex-1 bg-gray-50">
        <LinearGradient
          colors={['#059669', '#047857']}
          style={{
            paddingTop: insets.top + 8,
            paddingBottom: 16,
            paddingHorizontal: 16,
          }}
        >
          <Text className="text-white text-xl font-bold">My Profile</Text>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-6">
          <Animated.View
            entering={FadeInDown}
            className="bg-white rounded-2xl p-8 items-center w-full shadow-lg"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <Text className="text-4xl">👋</Text>
            </View>
            <Text className="text-gray-900 text-xl font-bold mb-2">
              Join Zovo
            </Text>
            <Text className="text-gray-500 text-center mb-6">
              Create an account to post your work, build your reputation, and
              connect with customers.
            </Text>
            <Pressable
              onPress={() => router.push('/auth')}
              className="bg-emerald-500 rounded-full px-8 py-3 w-full items-center active:bg-emerald-600"
            >
              <Text className="text-white font-bold text-lg">
                Sign Up / Log In
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#047857']}
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 60,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-white text-xl font-bold">My Profile</Text>
            {/* Live indicator */}
            <View className="bg-white/20 rounded-full px-2 py-1 flex-row items-center ml-2">
              <View className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1" />
              <Text className="text-white text-xs">Live</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/settings')}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Settings size={20} color="#fff" />
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1 -mt-12"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <Animated.View
          entering={FadeInUp}
          className="mx-4 bg-white rounded-2xl p-6 shadow-lg"
        >
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-3">
              <Text className="text-emerald-700 text-3xl font-bold">
                {currentUser.name.charAt(0)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-gray-900 text-xl font-bold">
                {currentUser.name}
              </Text>
              {currentUser.endorsementCount >= 5 && (
                <BadgeCheck size={20} color="#10b981" className="ml-1.5" />
              )}
            </View>
            <View className="flex-row items-center mt-1.5">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-gray-500 ml-1">{currentUser.area}</Text>
            </View>
          </View>

          {/* Skills */}
          <View className="flex-row flex-wrap justify-center gap-2 mt-4">
            {currentUser.skills.map((skill) => (
              <View
                key={skill}
                className="bg-emerald-100 rounded-full px-3 py-1.5"
              >
                <Text className="text-emerald-700 text-sm font-medium">
                  {skill}
                </Text>
              </View>
            ))}
          </View>

          {/* Real-time Stats */}
          <View className="flex-row mt-6 pt-4 border-t border-gray-100">
            <Animated.View style={[{ flex: 1 }, viewAnimatedStyle]}>
              <View className="items-center">
                <View className="flex-row items-center">
                  <Eye size={16} color="#059669" />
                  <Text className="text-gray-900 text-2xl font-bold ml-1">
                    {engagementStats.totalViews.toLocaleString()}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm">Views</Text>
              </View>
            </Animated.View>
            <View className="w-px bg-gray-200" />
            <Animated.View style={[{ flex: 1 }, shareAnimatedStyle]}>
              <View className="items-center">
                <View className="flex-row items-center">
                  <Share2 size={16} color="#059669" />
                  <Text className="text-gray-900 text-2xl font-bold ml-1">
                    {engagementStats.totalShares}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm">Shares</Text>
              </View>
            </Animated.View>
            <View className="w-px bg-gray-200" />
            <Animated.View style={[{ flex: 1 }, endorseAnimatedStyle]}>
              <View className="items-center">
                <View className="flex-row items-center">
                  <Star size={16} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-gray-900 text-2xl font-bold ml-1">
                    {engagementStats.totalEndorsements}
                  </Text>
                </View>
                <Text className="text-gray-500 text-sm">Endorsements</Text>
              </View>
            </Animated.View>
          </View>

          {/* Account age */}
          <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-gray-100">
            <Clock size={16} color="#6b7280" />
            <Text className="text-gray-500 ml-1.5">
              Member for {formatAccountAge(currentUser.createdAt)}
            </Text>
          </View>
        </Animated.View>

        {/* Real-time engagement notice */}
        <Animated.View
          entering={FadeInDown.delay(50)}
          className="mx-4 mt-4 bg-emerald-50 rounded-xl p-3 flex-row items-center"
        >
          <TrendingUp size={18} color="#059669" />
          <Text className="text-emerald-700 text-sm ml-2 flex-1">
            Stats update in real-time as users engage with your posts
          </Text>
        </Animated.View>

        {/* Recent posts */}
        <Animated.View
          entering={FadeInDown.delay(100)}
          className="mx-4 mt-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 font-bold text-lg">My Posts</Text>
            {userPosts.length > 0 && (
              <Pressable
                onPress={() => router.push(`/profile/${currentUser.id}`)}
              >
                <Text className="text-emerald-600 font-medium">View all</Text>
              </Pressable>
            )}
          </View>

          {userPosts.length === 0 ? (
            <View className="bg-gradient-to-br from-emerald-50 to-amber-50 rounded-xl p-6 items-center border border-emerald-100">
              <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-3">
                <Text className="text-3xl">📸</Text>
              </View>
              <Text className="text-gray-900 font-bold text-lg mb-1">
                Activate Your Profile!
              </Text>
              <Text className="text-gray-500 text-center text-sm mb-4">
                Post your first work to show customers what you can do. Your profile becomes visible once you post.
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/create')}
                className="bg-emerald-500 rounded-full px-6 py-3 active:bg-emerald-600"
              >
                <Text className="text-white font-bold">Post Your First Work</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ flexGrow: 0 }}
            >
              <View className="flex-row gap-3">
                {userPosts.slice(0, 5).map((post) => (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/post/${post.id}`)}
                    className="active:opacity-80"
                  >
                    <Image
                      source={{ uri: post.mediaUrl }}
                      className="w-28 h-28 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="absolute bottom-2 left-2 right-2">
                      <View className="bg-black/50 rounded-full px-2 py-1">
                        <Text
                          className="text-white text-xs"
                          numberOfLines={1}
                        >
                          {post.skills[0]}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </Animated.View>

        {/* Recent endorsements */}
        <Animated.View
          entering={FadeInDown.delay(200)}
          className="mx-4 mt-4"
        >
          <Text className="text-gray-900 font-bold text-lg mb-3">
            Recent Endorsements
          </Text>

          {userEndorsements.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center">
              <Star size={32} color="#d1d5db" />
              <Text className="text-gray-400 text-center mt-2">
                No endorsements yet. Keep posting quality work!
              </Text>
            </View>
          ) : (
            <View className="bg-white rounded-xl overflow-hidden">
              {userEndorsements.slice(0, 3).map((endorsement: EndorsementRecord, index: number) => {
                return (
                  <Pressable
                    key={endorsement.id}
                    onPress={() =>
                      router.push(`/profile/${endorsement.fromUserId}`)
                    }
                    className={cn(
                      "p-4 flex-row items-start active:bg-gray-50",
                      index > 0 && "border-t border-gray-100"
                    )}
                  >
                    <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center">
                      <Star size={18} color="#f59e0b" fill="#f59e0b" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">
                        Anonymous
                      </Text>
                      <Text
                        className="text-gray-500 text-sm mt-0.5"
                        numberOfLines={2}
                      >
                        "{endorsement.message}"
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {formatTimeAgo(new Date(endorsement.timestamp).toISOString())}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#9ca3af" />
                  </Pressable>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Logout button */}
        <Animated.View
          entering={FadeInDown.delay(300)}
          className="mx-4 mt-6"
        >
          <Pressable
            onPress={handleLogout}
            className="bg-white rounded-xl p-4 flex-row items-center justify-center active:bg-gray-50"
          >
            <LogOut size={18} color="#ef4444" />
            <Text className="text-red-500 font-medium ml-2">Log Out</Text>
          </Pressable>
        </Animated.View>

        {/* Disclaimer */}
        <Animated.View
          entering={FadeInDown.delay(400)}
          className="mx-4 mt-4 mb-4"
        >
          <View className="bg-gray-100 rounded-xl p-4">
            <Text className="text-gray-500 text-xs text-center leading-5">
              Public showcase only. All contact happens outside Zovo.
              Meet in safe locations and agree on terms before work begins.
              We do not process payments or verify workers.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
