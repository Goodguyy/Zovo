import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Flame, TrendingUp, Camera } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useSupabaseLeaderboard } from '@/lib/hooks/useSupabaseData';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userSkills: string[];
  totalViews: number;
  totalShares: number;
  totalEndorsements: number;
  engagementScore: number;
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<'week' | 'all'>('week');

  // Fetch leaderboard from Supabase
  const { leaderboard: profiles, loading, refetch } = useSupabaseLeaderboard(20);

  // Animation values for top 3
  const topScale = useSharedValue(1);

  // Build leaderboard entries from profiles
  const leaderboard: LeaderboardEntry[] = React.useMemo(() => {
    return profiles
      .filter(p => p.totalViews > 0 || p.totalShares > 0 || p.endorsementCount > 0)
      .map((profile, index) => {
        const engagementScore = profile.totalViews + (profile.totalShares * 2) + (profile.endorsementCount * 3);
        return {
          rank: index + 1,
          userId: profile.id,
          userName: profile.name,
          userSkills: profile.skills,
          totalViews: profile.totalViews,
          totalShares: profile.totalShares,
          totalEndorsements: profile.endorsementCount,
          engagementScore,
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [profiles]);

  useEffect(() => {
    if (leaderboard.length > 0) {
      topScale.value = withSequence(withSpring(0.9), withSpring(1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [leaderboard.length, topScale]);

  const topAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: topScale.value }],
  }));

  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#059669', '#047857']}
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 24,
          paddingHorizontal: 16,
        }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Trophy size={28} color="#fbbf24" />
          <Text className="text-white text-2xl font-bold">Leaderboard</Text>
        </View>
        <Text className="text-white/80 text-sm">
          Top creators by engagement
        </Text>

        {/* Timeframe toggle */}
        <View className="flex-row gap-2 mt-4">
          <Pressable
            onPress={() => {
              setTimeframe('week');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={cn(
              'flex-1 py-2 rounded-full items-center',
              timeframe === 'week' ? 'bg-white' : 'bg-white/20'
            )}
          >
            <Text
              className={cn(
                'font-semibold text-sm',
                timeframe === 'week' ? 'text-emerald-600' : 'text-white'
              )}
            >
              This Week
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setTimeframe('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            className={cn(
              'flex-1 py-2 rounded-full items-center',
              timeframe === 'all' ? 'bg-white' : 'bg-white/20'
            )}
          >
            <Text
              className={cn(
                'font-semibold text-sm',
                timeframe === 'all' ? 'text-emerald-600' : 'text-white'
              )}
            >
              All Time
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading State */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-gray-500 mt-4">Loading leaderboard...</Text>
          </View>
        ) : leaderboard.length === 0 ? (
          <Animated.View
            entering={FadeInDown}
            className="flex-1 items-center justify-center px-6 py-16"
          >
            <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-4">
              <Trophy size={36} color="#f59e0b" />
            </View>
            <Text className="text-gray-900 text-xl font-bold mb-2">
              No rankings yet
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-6">
              Post your work and engage with others to climb the leaderboard!
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/create')}
              className="bg-emerald-500 rounded-full px-6 py-3"
            >
              <Text className="text-white font-semibold">Post Your Work</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            {/* Top 3 Podium */}
            {topThree.length > 0 && (
              <Animated.View style={topAnimatedStyle} className="px-4 mt-6 mb-6">
                <View className="flex-row items-end gap-2 justify-center">
                  {/* 2nd Place */}
                  {topThree[1] && (
                    <Animated.View entering={FadeInDown.delay(100)} className="flex-1 items-center">
                      <View className="bg-gray-200 rounded-2xl p-4 w-full items-center mb-2">
                        <Text className="text-4xl mb-2">🥈</Text>
                        <Text className="text-gray-900 font-bold text-sm text-center" numberOfLines={1}>
                          {topThree[1].userName}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Flame size={14} color="#f97316" />
                          <Text className="text-gray-700 font-semibold ml-1">
                            {topThree[1].engagementScore}
                          </Text>
                        </View>
                      </View>
                      <View className="h-16 w-full bg-gray-200 rounded-t-lg items-center justify-center">
                        <Text className="text-gray-600 font-bold">2</Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* 1st Place */}
                  {topThree[0] && (
                    <Animated.View entering={FadeInUp} className="flex-1 items-center">
                      <LinearGradient
                        colors={['#fbbf24', '#f59e0b']}
                        style={{ borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 8 }}
                      >
                        <Text className="text-5xl mb-2">🥇</Text>
                        <Text className="text-amber-900 font-bold text-center" numberOfLines={1}>
                          {topThree[0].userName}
                        </Text>
                        <View className="flex-row items-center mt-2 bg-white/30 rounded-full px-2 py-1">
                          <Flame size={16} color="#b45309" />
                          <Text className="text-amber-900 font-bold ml-1">
                            {topThree[0].engagementScore}
                          </Text>
                        </View>
                      </LinearGradient>
                      <LinearGradient
                        colors={['#fbbf24', '#f59e0b']}
                        style={{ height: 96, width: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Text className="text-white font-bold text-2xl">1</Text>
                      </LinearGradient>
                    </Animated.View>
                  )}

                  {/* 3rd Place */}
                  {topThree[2] && (
                    <Animated.View entering={FadeInDown.delay(200)} className="flex-1 items-center">
                      <View className="bg-orange-100 rounded-2xl p-4 w-full items-center mb-2">
                        <Text className="text-4xl mb-2">🥉</Text>
                        <Text className="text-orange-900 font-bold text-sm text-center" numberOfLines={1}>
                          {topThree[2].userName}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Flame size={14} color="#f97316" />
                          <Text className="text-orange-700 font-semibold ml-1">
                            {topThree[2].engagementScore}
                          </Text>
                        </View>
                      </View>
                      <View className="h-12 w-full bg-orange-100 rounded-t-lg items-center justify-center">
                        <Text className="text-orange-600 font-bold">3</Text>
                      </View>
                    </Animated.View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Stats Info */}
            <Animated.View
              entering={FadeInDown.delay(300)}
              className="mx-4 mb-6 bg-white rounded-xl p-4 flex-row gap-3"
            >
              <View className="flex-1 items-center py-2">
                <View className="flex-row items-center">
                  <TrendingUp size={16} color="#059669" />
                  <Text className="text-gray-900 font-bold text-lg ml-1">
                    {topThree[0]?.engagementScore ?? 0}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Top Score</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center py-2">
                <View className="flex-row items-center">
                  <Trophy size={16} color="#059669" />
                  <Text className="text-gray-900 font-bold text-lg ml-1">
                    {leaderboard.length}
                  </Text>
                </View>
                <Text className="text-gray-500 text-xs mt-1">Total Creators</Text>
              </View>
            </Animated.View>

            {/* Rest of Leaderboard */}
            {restOfLeaderboard.length > 0 && (
              <Animated.View entering={FadeInDown.delay(400)} className="px-4">
                <Text className="text-gray-900 font-bold text-lg mb-3">Rankings</Text>
                <View className="bg-white rounded-xl overflow-hidden">
                  {restOfLeaderboard.map((entry, index) => (
                    <Pressable
                      key={entry.userId}
                      onPress={() => router.push(`/profile/${entry.userId}`)}
                      className={cn(
                        'p-4 flex-row items-center active:bg-gray-50',
                        index > 0 && 'border-t border-gray-100'
                      )}
                    >
                      {/* Rank */}
                      <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                        <Text className="text-emerald-700 font-bold text-sm">
                          #{entry.rank}
                        </Text>
                      </View>

                      {/* Info */}
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">
                          {entry.userName}
                        </Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          {entry.userSkills.slice(0, 2).map((skill) => (
                            <View
                              key={skill}
                              className="bg-emerald-100 rounded-full px-2 py-0.5"
                            >
                              <Text className="text-emerald-700 text-xs font-medium">
                                {skill}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Score */}
                      <View className="items-end">
                        <View className="flex-row items-center">
                          <Flame size={16} color="#f97316" />
                          <Text className="text-gray-900 font-bold ml-1">
                            {entry.engagementScore}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-xs mt-1">
                          {entry.totalViews} views
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}
          </>
        )}

        {/* Info card */}
        <Animated.View entering={FadeInDown.delay(500)} className="mx-4 mt-6 mb-6">
          <View className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <Text className="text-emerald-900 font-semibold text-sm mb-1">
              How Rankings Work
            </Text>
            <Text className="text-emerald-800 text-xs leading-5">
              • Views = 1 point{'\n'}
              • Shares = 2 points{'\n'}
              • Endorsements = 3 points{'\n'}
              Post quality work and engage with the community!
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
