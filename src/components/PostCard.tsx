import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, Share2, MapPin, BadgeCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Post, useAppStore, formatTimeAgo } from '@/lib/store';
import { cn } from '@/lib/cn';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface PostCardProps {
  post: Post;
  index?: number;
  onShare?: () => void;
}

export function PostCard({ post, index = 0, onShare }: PostCardProps) {
  const router = useRouter();
  const profiles = useAppStore((s) => s.profiles);

  const profile = useMemo(() =>
    profiles.find((p) => p.id === post.userId),
    [profiles, post.userId]
  );

  const handlePress = () => {
    router.push(`/post/${post.id}`);
  };

  const handleProfilePress = () => {
    router.push(`/profile/${post.userId}`);
  };

  if (!profile) return null;

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
            width: CARD_WIDTH,
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
              className="w-full h-56"
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

            {/* View count badge */}
            <View className="absolute top-3 right-3 bg-black/50 rounded-full px-3 py-1.5 flex-row items-center">
              <Eye size={14} color="#fff" />
              <Text className="text-white text-xs font-medium ml-1.5">
                {post.viewCount.toLocaleString()}
              </Text>
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
                onPress={(e) => {
                  e.stopPropagation();
                  onShare?.();
                }}
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
