import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, Share2, MapPin, BadgeCheck, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { useAppStore, formatTimeAgo } from '@/lib/store';
import { useSupabaseProfile, type AppPost } from '@/lib/hooks/useSupabaseData';
import { useEngagement } from '@/lib/useEngagement';
import * as Haptics from 'expo-haptics';

interface PostCardProps {
  post: AppPost;
  index?: number;
  onShare?: () => void;
  onVisible?: () => void;
}

export function PostCard({ post, index = 0, onShare, onVisible }: PostCardProps) {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const hasTrackedView = useRef(false);

  // Fetch profile from Supabase
  const { profile } = useSupabaseProfile(post.userId);

  // Real-time engagement data
  const {
    viewCount,
    shareCount,
    endorsementCount,
    trackView,
  } = useEngagement(post.id, post.userId);

  // Animation for metric updates
  const viewScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const endorseScale = useSharedValue(1);

  // Track view when card becomes visible
  useEffect(() => {
    if (!hasTrackedView.current && currentUser?.id) {
      hasTrackedView.current = true;
      trackView();
      onVisible?.();
    }
  }, [currentUser?.id, trackView, onVisible]);

  // Animate metrics when they change
  const prevViewCount = useRef(viewCount);
  const prevShareCount = useRef(shareCount);
  const prevEndorseCount = useRef(endorsementCount);

  useEffect(() => {
    if (viewCount > prevViewCount.current) {
      viewScale.value = withSequence(withSpring(1.3), withSpring(1));
    }
    prevViewCount.current = viewCount;
  }, [viewCount, viewScale]);

  useEffect(() => {
    if (shareCount > prevShareCount.current) {
      shareScale.value = withSequence(withSpring(1.3), withSpring(1));
    }
    prevShareCount.current = shareCount;
  }, [shareCount, shareScale]);

  useEffect(() => {
    if (endorsementCount > prevEndorseCount.current) {
      endorseScale.value = withSequence(withSpring(1.3), withSpring(1));
    }
    prevEndorseCount.current = endorsementCount;
  }, [endorsementCount, endorseScale]);

  const viewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: viewScale.value }],
  }));

  const shareAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareScale.value }],
  }));

  const endorseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: endorseScale.value }],
  }));

  const handlePress = () => {
    router.push(`/post/${post.id}`);
  };

  const handleProfilePress = () => {
    router.push(`/profile/${post.userId}`);
  };

  const handleSharePress = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShare?.();
  };

  if (!profile) return null;

  // Use real-time counts from engagement system
  const displayViewCount = viewCount;
  const displayShareCount = shareCount;

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).springify()}
      className="mb-4"
    >
      <Pressable
        onPress={handlePress}
        className="active:scale-[0.98] transition-transform"
      >
        <View
          className="bg-white rounded-2xl overflow-hidden shadow-lg"
          style={{
            width: '100%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          {/* Media */}
          <View className="relative">
            <Image
              source={{ uri: post.mediaUrl }}
              style={{ width: '100%', height: 220, maxWidth: '100%' }}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 100,
              }}
            />

            {/* Engagement badges */}
            <View className="absolute top-3 right-3 flex-row gap-2">
              {/* Views badge */}
              <Animated.View style={viewAnimatedStyle}>
                <View className="bg-black/50 rounded-full px-2.5 py-1.5 flex-row items-center">
                  <Eye size={12} color="#fff" />
                  <Text className="text-white text-xs font-medium ml-1">
                    {displayViewCount.toLocaleString()}
                  </Text>
                </View>
              </Animated.View>

              {/* Shares badge */}
              {displayShareCount > 0 && (
                <Animated.View style={shareAnimatedStyle}>
                  <View className="bg-black/50 rounded-full px-2.5 py-1.5 flex-row items-center">
                    <Share2 size={12} color="#fff" />
                    <Text className="text-white text-xs font-medium ml-1">
                      {displayShareCount}
                    </Text>
                  </View>
                </Animated.View>
              )}

              {/* Endorsements badge */}
              {endorsementCount > 0 && (
                <Animated.View style={endorseAnimatedStyle}>
                  <View className="bg-amber-500/80 rounded-full px-2.5 py-1.5 flex-row items-center">
                    <Heart size={12} color="#fff" fill="#fff" />
                    <Text className="text-white text-xs font-medium ml-1">
                      {endorsementCount}
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Skills tags on image */}
            <View className="absolute bottom-3 left-3 right-3 flex-row flex-wrap gap-1.5">
              {post.skills.map((skill) => (
                <View
                  key={skill}
                  className="bg-emerald-500 rounded-full px-2.5 py-1"
                >
                  <Text className="text-white text-xs font-semibold">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Content */}
          <View className="p-4">
            {/* Profile row */}
            <Pressable
              onPress={handleProfilePress}
              className="flex-row items-center mb-3 active:opacity-70"
            >
              <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                <Text className="text-emerald-700 font-bold text-lg">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="font-semibold text-gray-900">
                    {profile.name}
                  </Text>
                  {profile.endorsementCount >= 5 && (
                    <BadgeCheck size={16} color="#10b981" className="ml-1" />
                  )}
                </View>
                <View className="flex-row items-center">
                  <MapPin size={12} color="#6b7280" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {post.area}
                  </Text>
                  <Text className="text-gray-400 text-xs mx-1.5">•</Text>
                  <Text className="text-gray-500 text-xs">
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                </View>
              </View>
            </Pressable>

            {/* Caption */}
            <Text
              className="text-gray-700 text-sm leading-5"
              numberOfLines={3}
            >
              {post.caption}
            </Text>

            {/* Actions */}
            <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <Text className="text-emerald-600 font-medium text-sm">
                View work details
              </Text>
              <Pressable
                onPress={handleSharePress}
                className="flex-row items-center bg-emerald-50 rounded-full px-3 py-1.5 active:bg-emerald-100"
              >
                <Share2 size={14} color="#059669" />
                <Text className="text-emerald-600 text-xs font-medium ml-1.5">
                  Share
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
