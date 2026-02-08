import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Share2,
  BadgeCheck,
  MapPin,
  Clock,
  Star,
  MessageCircle,
  Phone,
  Eye,
  ChevronRight,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { formatAccountAge, formatTimeAgo } from '@/lib/store';
import { useSupabaseProfile, useSupabasePosts, useSupabaseProfiles, AppPost, AppProfile } from '@/lib/hooks/useSupabaseData';
import { getEndorsementsForUser } from '@/lib/services/supabaseService';
import { cn } from '@/lib/cn';

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Fetch profile data from Supabase
  const { profile, loading: profileLoading } = useSupabaseProfile(id);
  const { posts: userPosts, loading: postsLoading } = useSupabasePosts({ userId: id });
  const { profiles } = useSupabaseProfiles();

  // Fetch endorsements
  const [userEndorsements, setUserEndorsements] = useState<any[]>([]);
  const [givenEndorsements, setGivenEndorsements] = useState<any[]>([]);
  const [endorsementsLoading, setEndorsementsLoading] = useState(true);

  useEffect(() => {
    async function fetchEndorsements() {
      if (!id) return;
      setEndorsementsLoading(true);
      const endorsements = await getEndorsementsForUser(id);
      setUserEndorsements(endorsements);
      // For now, given endorsements would need a different query
      // This is a placeholder - we'd need to add a service function for this
      setGivenEndorsements([]);
      setEndorsementsLoading(false);
    }
    fetchEndorsements();
  }, [id]);

  const totalViews = userPosts.reduce((sum: number, p: AppPost) => sum + p.viewCount, 0);
  const loading = profileLoading || postsLoading || endorsementsLoading;

  if (!profile) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Profile not found</Text>
      </View>
    );
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${profile.name} on HustleWall!\n\nSkills: ${profile.skills.join(', ')}\nArea: ${profile.area}\n${profile.endorsementCount} endorsements\n\nFind skilled workers on HustleWall!`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ${profile.name}, I found your profile on HustleWall and I'm interested in your services.`
    );
    Linking.openURL(`https://wa.me/${profile.whatsapp.replace(/\+/g, '')}?text=${message}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${profile.phone}`);
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
            paddingBottom: 60,
            paddingHorizontal: 16,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <ArrowLeft size={22} color="#fff" />
            </Pressable>
            <Text className="text-white text-lg font-semibold">Profile</Text>
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
            >
              <Share2 size={20} color="#fff" />
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
              <View className="w-24 h-24 rounded-full bg-emerald-100 items-center justify-center mb-3">
                <Text className="text-emerald-700 text-4xl font-bold">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-gray-900 text-2xl font-bold">
                  {profile.name}
                </Text>
                {profile.endorsementCount >= 5 && (
                  <BadgeCheck size={24} color="#10b981" className="ml-1.5" />
                )}
              </View>
              <View className="flex-row items-center mt-1.5">
                <MapPin size={16} color="#6b7280" />
                <Text className="text-gray-500 text-base ml-1">
                  {profile.area}
                </Text>
              </View>
            </View>

            {/* Skills */}
            <View className="flex-row flex-wrap justify-center gap-2 mt-4">
              {profile.skills.map((skill: string) => (
                <View
                  key={skill}
                  className="bg-emerald-100 rounded-full px-4 py-2"
                >
                  <Text className="text-emerald-700 font-medium">{skill}</Text>
                </View>
              ))}
            </View>

            {/* Stats */}
            <View className="flex-row mt-6 pt-4 border-t border-gray-100">
              <View className="flex-1 items-center">
                <Text className="text-gray-900 text-2xl font-bold">
                  {userPosts.length}
                </Text>
                <Text className="text-gray-500 text-sm">Posts</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <Text className="text-gray-900 text-2xl font-bold">
                  {profile.endorsementCount}
                </Text>
                <Text className="text-gray-500 text-sm">Endorsements</Text>
              </View>
              <View className="w-px bg-gray-200" />
              <View className="flex-1 items-center">
                <Text className="text-gray-900 text-2xl font-bold">
                  {totalViews.toLocaleString()}
                </Text>
                <Text className="text-gray-500 text-sm">Views</Text>
              </View>
            </View>

            {/* Account age */}
            <View className="flex-row items-center justify-center mt-4 pt-4 border-t border-gray-100">
              <Clock size={16} color="#6b7280" />
              <Text className="text-gray-500 ml-1.5">
                Member for {formatAccountAge(profile.createdAt)}
              </Text>
            </View>
          </Animated.View>

          {/* Contact buttons */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="mx-4 mt-4"
          >
            <View className="flex-row gap-3">
              <Pressable
                onPress={handleWhatsApp}
                className="flex-1 bg-green-500 rounded-xl py-4 flex-row items-center justify-center active:bg-green-600"
              >
                <MessageCircle size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={handleCall}
                className="flex-1 bg-blue-500 rounded-xl py-4 flex-row items-center justify-center active:bg-blue-600"
              >
                <Phone size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Call</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Work posts */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="mx-4 mt-4"
          >
            <Text className="text-gray-900 font-bold text-lg mb-3">
              Work History ({userPosts.length})
            </Text>

            {userPosts.length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Text className="text-gray-400">No posts yet</Text>
              </View>
            ) : (
              <View className="bg-white rounded-xl overflow-hidden">
                {userPosts.map((post: AppPost, index: number) => (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/post/${post.id}`)}
                    className={cn(
                      "p-4 flex-row active:bg-gray-50",
                      index > 0 && "border-t border-gray-100"
                    )}
                  >
                    <Image
                      source={{ uri: post.mediaUrl }}
                      style={{ width: 80, height: 80, borderRadius: 8 }}
                      resizeMode="cover"
                    />
                    <View className="ml-3 flex-1 justify-center">
                      <View className="flex-row flex-wrap gap-1 mb-1">
                        {post.skills.map((skill: string) => (
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
                      <Text
                        className="text-gray-700 text-sm"
                        numberOfLines={2}
                      >
                        {post.caption}
                      </Text>
                      <View className="flex-row items-center mt-1.5">
                        <Eye size={12} color="#9ca3af" />
                        <Text className="text-gray-400 text-xs ml-1">
                          {post.viewCount}
                        </Text>
                        <Text className="text-gray-300 mx-1.5">•</Text>
                        <Text className="text-gray-400 text-xs">
                          {formatTimeAgo(post.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#9ca3af" className="self-center" />
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Endorsements received */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="mx-4 mt-4"
          >
            <Text className="text-gray-900 font-bold text-lg mb-3">
              Endorsements Received ({userEndorsements.length})
            </Text>

            {userEndorsements.length === 0 ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Star size={32} color="#d1d5db" />
                <Text className="text-gray-400 text-center mt-2">
                  No endorsements yet
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-xl overflow-hidden">
                {userEndorsements.map((endorsement: any, index: number) => {
                  const endorser = profiles.find(
                    (p: AppProfile) => p.id === endorsement.fromUserId
                  );
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
                          {endorser?.name || 'Anonymous'}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-0.5">
                          "{endorsement.message}"
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {formatTimeAgo(endorsement.createdAt)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#9ca3af" />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Endorsements given - shows traceable history */}
          {givenEndorsements.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(400)}
              className="mx-4 mt-4"
            >
              <Text className="text-gray-900 font-bold text-lg mb-3">
                Endorsements Given ({givenEndorsements.length})
              </Text>
              <View className="bg-white rounded-xl overflow-hidden">
                {givenEndorsements.map((endorsement: any, index: number) => {
                  const endorsed = profiles.find(
                    (p: AppProfile) => p.id === endorsement.toUserId
                  );
                  return (
                    <Pressable
                      key={endorsement.id}
                      onPress={() =>
                        router.push(`/profile/${endorsement.toUserId}`)
                      }
                      className={cn(
                        "p-4 flex-row items-start active:bg-gray-50",
                        index > 0 && "border-t border-gray-100"
                      )}
                    >
                      <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                        <Text className="text-emerald-700 font-bold">
                          {endorsed?.name.charAt(0) || '?'}
                        </Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-gray-900 font-medium">
                          Endorsed {endorsed?.name || 'Someone'}
                        </Text>
                        <Text className="text-gray-600 text-sm mt-0.5">
                          "{endorsement.message}"
                        </Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          {formatTimeAgo(endorsement.createdAt)}
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#9ca3af" />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Safety notice */}
          <View className="mx-4 mt-4 bg-amber-50 rounded-xl p-4">
            <Text className="text-amber-800 font-semibold text-sm mb-1">
              Verify Before You Hire
            </Text>
            <Text className="text-amber-700 text-xs leading-5">
              This profile shows public endorsement history. Check the endorser's
              profiles to verify their credibility. HustleWall does not guarantee
              work quality.
            </Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
