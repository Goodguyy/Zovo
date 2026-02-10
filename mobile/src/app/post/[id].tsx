import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Share,
  Linking,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  Eye,
  MapPin,
  BadgeCheck,
  MessageCircle,
  Phone,
  Star,
  Clock,
  ChevronRight,
  TrendingUp,
  Users,
  AlertCircle,
  Heart,
  Trash2,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { useAppStore, formatTimeAgo } from '@/lib/store';
import { useEngagement } from '@/lib/useEngagement';
import { useSupabaseProfile, AppPost, AppProfile } from '@/lib/hooks/useSupabaseData';
import { getPostById, getProfileById, deletePost } from '@/lib/services/supabaseService';
import { DBPost } from '@/lib/supabase';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

// Transform DB post to App post format
const transformDBPostToAppPost = (dbPost: DBPost): AppPost => ({
  id: dbPost.id,
  userId: dbPost.user_id,
  mediaUrl: dbPost.media_url,
  mediaType: dbPost.media_type,
  caption: dbPost.caption,
  skills: dbPost.skills,
  area: dbPost.area,
  viewCount: dbPost.view_count,
  shareCount: dbPost.share_count,
  endorsementCount: dbPost.endorsement_count,
  createdAt: dbPost.created_at,
});

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  // State for fetched post and profile
  const [post, setPost] = useState<AppPost | null>(null);
  const [profile, setProfile] = useState<AppProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch post and profile from Supabase
  const fetchPostAndProfile = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError('No post ID provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dbPost = await getPostById(id);
      if (!dbPost) {
        setError('Post not found');
        setLoading(false);
        return;
      }

      const appPost = transformDBPostToAppPost(dbPost);
      setPost(appPost);

      // Fetch the profile for this post
      const dbProfile = await getProfileById(dbPost.user_id);
      if (dbProfile) {
        setProfile({
          id: dbProfile.id,
          phone: dbProfile.phone,
          name: dbProfile.name,
          whatsapp: dbProfile.whatsapp,
          skills: dbProfile.skills,
          area: dbProfile.area,
          createdAt: dbProfile.created_at,
          endorsementCount: dbProfile.total_endorsements,
          totalViews: dbProfile.total_views,
          totalShares: dbProfile.total_shares,
        });
      }
    } catch (err) {
      console.log('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPostAndProfile();
  }, [fetchPostAndProfile]);

  // Real-time engagement tracking
  const {
    viewCount,
    shareCount,
    endorsementCount,
    endorsements,
    uniqueViewers,
    recentViews24h,
    canUserEndorse,
    hasEndorsed,
    endorseBlockReason,
    trackView,
    trackShare,
    submitEndorsement,
  } = useEngagement(id ?? '', post?.userId);

  // Track view on mount
  useEffect(() => {
    if (id && currentUser?.id && post) {
      trackView();
    }
  }, [id, currentUser?.id, post, trackView]);

  const [showEndorseForm, setShowEndorseForm] = useState(false);
  const [endorseMessage, setEndorseMessage] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user owns this post
  const isOwner = currentUser?.id === post?.userId;

  // Animation values for live metrics
  const viewScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const endorseScale = useSharedValue(1);

  const prevViewCount = useRef(viewCount);
  const prevShareCount = useRef(shareCount);
  const prevEndorseCount = useRef(endorsementCount);

  useEffect(() => {
    if (viewCount > prevViewCount.current) {
      viewScale.value = withSequence(withSpring(1.2), withSpring(1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    prevViewCount.current = viewCount;
  }, [viewCount, viewScale]);

  useEffect(() => {
    if (shareCount > prevShareCount.current) {
      shareScale.value = withSequence(withSpring(1.2), withSpring(1));
    }
    prevShareCount.current = shareCount;
  }, [shareCount, shareScale]);

  useEffect(() => {
    if (endorsementCount > prevEndorseCount.current) {
      endorseScale.value = withSequence(withSpring(1.2), withSpring(1));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  // Loading state
  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-gray-50 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
          <Text className="text-gray-500 mt-3">Loading post...</Text>
        </View>
      </>
    );
  }

  // Error or not found state
  if (error || !post || !profile) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 bg-gray-50 items-center justify-center px-6">
          <AlertCircle size={48} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-3">
            {error || 'Post not found'}
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-4 bg-emerald-500 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-medium">Go Back</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out ${profile.name}'s work on Zovo!\n\n"${post.caption.substring(0, 150)}..."\n\nSkills: ${post.skills.join(', ')}\nArea: ${post.area}\n\nFind skilled workers on Zovo!`,
      });
      if (result.action === Share.sharedAction) {
        await trackShare('other');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ${profile.name}, I saw your work on Zovo and I'm interested in your services.`
    );
    Linking.openURL(`https://wa.me/${profile.whatsapp.replace(/\+/g, '')}?text=${message}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${profile.phone}`);
  };

  const handleEndorse = async () => {
    if (!isAuthenticated || !currentUser) {
      router.push('/auth');
      return;
    }

    if (!canUserEndorse) {
      setErrorMessage(endorseBlockReason || "You can't endorse this post");
      setShowErrorModal(true);
      return;
    }

    if (!endorseMessage.trim()) {
      setErrorMessage('Please write something about this worker');
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    const result = await submitEndorsement(endorseMessage.trim());
    setIsSubmitting(false);

    if (result.success) {
      setEndorseMessage('');
      setShowEndorseForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      setErrorMessage(result.error || 'Failed to submit endorsement');
      setShowErrorModal(true);
    }
  };

  const handleDeletePost = () => {
    if (!currentUser?.id || !post?.id) return;

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const result = await deletePost(post.id, currentUser.id);
            setIsDeleting(false);

            if (result.success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } else {
              setErrorMessage(result.error || 'Failed to delete post');
              setShowErrorModal(true);
            }
          },
        },
      ]
    );
  };

  // Use real-time counts with fallback
  const displayViewCount = viewCount || post.viewCount;
  const displayShareCount = shareCount || post.shareCount;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-gray-50">
        {/* Image header */}
        <View className="relative">
          <Image
            source={{ uri: post.mediaUrl }}
            style={{ width: '100%', height: 320, maxWidth: '100%' }}
            resizeMode="cover"
          />

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-12 left-4 w-10 h-10 bg-black/40 rounded-full items-center justify-center"
            style={{ top: insets.top + 8 }}
          >
            <ArrowLeft size={22} color="#fff" />
          </Pressable>

          {/* Action buttons */}
          <View className="absolute top-12 right-4 flex-row gap-2" style={{ top: insets.top + 8 }}>
            {/* Delete button (only for owner) */}
            {isOwner && (
              <Pressable
                onPress={handleDeletePost}
                disabled={isDeleting}
                className="w-10 h-10 bg-red-500/80 rounded-full items-center justify-center"
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Trash2 size={18} color="#fff" />
                )}
              </Pressable>
            )}
            {/* Share button */}
            <Pressable
              onPress={handleShare}
              className="w-10 h-10 bg-black/40 rounded-full items-center justify-center"
            >
              <Share2 size={20} color="#fff" />
            </Pressable>
          </View>

          {/* Live engagement stats */}
          <View className="absolute bottom-4 left-4 right-4 flex-row gap-2">
            <Animated.View style={viewAnimatedStyle}>
              <View className="bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                <Eye size={14} color="#fff" />
                <Text className="text-white text-sm font-medium ml-1.5">
                  {displayViewCount.toLocaleString()}
                </Text>
              </View>
            </Animated.View>

            {displayShareCount > 0 && (
              <Animated.View style={shareAnimatedStyle}>
                <View className="bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                  <Share2 size={14} color="#fff" />
                  <Text className="text-white text-sm font-medium ml-1.5">
                    {displayShareCount}
                  </Text>
                </View>
              </Animated.View>
            )}

            {endorsementCount > 0 && (
              <Animated.View style={endorseAnimatedStyle}>
                <View className="bg-amber-500 rounded-full px-3 py-1.5 flex-row items-center">
                  <Heart size={14} color="#fff" fill="#fff" />
                  <Text className="text-white text-sm font-medium ml-1.5">
                    {endorsementCount}
                  </Text>
                </View>
              </Animated.View>
            )}
          </View>
        </View>

        <ScrollView
          className="flex-1 -mt-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Content card */}
          <Animated.View
            entering={FadeInUp}
            className="mx-4 bg-white rounded-2xl p-5 shadow-lg"
          >
            {/* Skills */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {post.skills.map((skill: string) => (
                <View
                  key={skill}
                  className="bg-emerald-500 rounded-full px-3 py-1.5"
                >
                  <Text className="text-white text-sm font-semibold">
                    {skill}
                  </Text>
                </View>
              ))}
            </View>

            {/* Caption */}
            <Text className="text-gray-900 text-base leading-6 mb-4">
              {post.caption}
            </Text>

            {/* Meta */}
            <View className="flex-row items-center">
              <MapPin size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1">{post.area}</Text>
              <Text className="text-gray-400 mx-2">-</Text>
              <Clock size={14} color="#6b7280" />
              <Text className="text-gray-500 text-sm ml-1">
                {formatTimeAgo(post.createdAt)}
              </Text>
            </View>
          </Animated.View>

          {/* Live engagement insights */}
          <Animated.View
            entering={FadeInDown.delay(50)}
            className="mx-4 mt-4"
          >
            <Text className="text-gray-900 font-bold text-lg mb-3">
              Live Engagement
            </Text>
            <View className="bg-white rounded-xl p-4">
              <View className="flex-row">
                <View className="flex-1 items-center py-2">
                  <View className="flex-row items-center mb-1">
                    <Users size={16} color="#059669" />
                    <Text className="text-gray-900 text-xl font-bold ml-1.5">
                      {uniqueViewers}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs">Unique viewers</Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="flex-1 items-center py-2">
                  <View className="flex-row items-center mb-1">
                    <TrendingUp size={16} color="#059669" />
                    <Text className="text-gray-900 text-xl font-bold ml-1.5">
                      {recentViews24h}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-xs">Views (24h)</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Worker profile */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="mx-4 mt-4"
          >
            <Text className="text-gray-900 font-bold text-lg mb-3">
              About the Worker
            </Text>
            <Pressable
              onPress={() => router.push(`/profile/${profile.id}`)}
              className="bg-white rounded-xl p-4 flex-row items-center active:bg-gray-50"
            >
              <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center">
                <Text className="text-emerald-700 font-bold text-xl">
                  {profile.name.charAt(0)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-gray-900 font-semibold text-lg">
                    {profile.name}
                  </Text>
                  {profile.endorsementCount >= 5 && (
                    <BadgeCheck size={18} color="#10b981" className="ml-1" />
                  )}
                </View>
                <View className="flex-row items-center mt-1">
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <Text className="text-gray-600 text-sm ml-1">
                    {profile.endorsementCount} endorsements
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </Pressable>
          </Animated.View>

          {/* Contact buttons */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="mx-4 mt-4"
          >
            <Text className="text-gray-900 font-bold text-lg mb-3">
              Contact {profile.name.split(' ')[0]}
            </Text>
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

          {/* Endorsements */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="mx-4 mt-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-bold text-lg">
                Endorsements ({endorsementCount})
              </Text>
              {!showEndorseForm && (
                <Pressable
                  onPress={() => {
                    if (!isAuthenticated) {
                      router.push('/auth');
                      return;
                    }
                    if (!canUserEndorse) {
                      setErrorMessage(endorseBlockReason || "You can't endorse this post");
                      setShowErrorModal(true);
                      return;
                    }
                    setShowEndorseForm(true);
                  }}
                  className={cn(
                    "rounded-full px-4 py-2 flex-row items-center",
                    hasEndorsed ? "bg-gray-100" : "bg-amber-100"
                  )}
                >
                  <Star size={16} color={hasEndorsed ? "#9ca3af" : "#f59e0b"} />
                  <Text
                    className={cn(
                      "font-medium ml-1.5",
                      hasEndorsed ? "text-gray-400" : "text-amber-700"
                    )}
                  >
                    {hasEndorsed ? "Endorsed" : "Endorse"}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Endorse form */}
            {showEndorseForm && (
              <Animated.View
                entering={FadeIn}
                className="bg-amber-50 rounded-xl p-4 mb-4"
              >
                <Text className="text-amber-800 font-semibold mb-2">
                  Share your experience
                </Text>
                <TextInput
                  value={endorseMessage}
                  onChangeText={setEndorseMessage}
                  placeholder="E.g., Great work, delivered on time, very professional..."
                  multiline
                  numberOfLines={3}
                  className="bg-white rounded-lg p-3 text-gray-900 min-h-[80]"
                  placeholderTextColor="#9ca3af"
                  style={{ textAlignVertical: 'top' }}
                />
                <View className="flex-row gap-2 mt-3">
                  <Pressable
                    onPress={() => {
                      setShowEndorseForm(false);
                      setEndorseMessage('');
                    }}
                    className="flex-1 bg-gray-200 rounded-lg py-2.5 items-center"
                  >
                    <Text className="text-gray-700 font-medium">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleEndorse}
                    disabled={isSubmitting}
                    className={cn(
                      "flex-1 rounded-lg py-2.5 items-center",
                      isSubmitting ? "bg-amber-300" : "bg-amber-500"
                    )}
                  >
                    <Text className="text-white font-medium">
                      {isSubmitting ? "Submitting..." : "Submit"}
                    </Text>
                  </Pressable>
                </View>
                <Text className="text-amber-600 text-xs mt-2 text-center">
                  Your name will be visible with this endorsement
                </Text>
              </Animated.View>
            )}

            {endorsements.length === 0 && !showEndorseForm ? (
              <View className="bg-white rounded-xl p-6 items-center">
                <Star size={32} color="#d1d5db" />
                <Text className="text-gray-400 text-center mt-2">
                  No endorsements yet. Be the first!
                </Text>
              </View>
            ) : (
              <View className="bg-white rounded-xl overflow-hidden">
                {endorsements.map((endorsement: { id: string; fromUserId: string; message: string; timestamp: number; fromUserName?: string }, index: number) => (
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
                      <Text className="text-amber-700 font-bold">
                        {endorsement.fromUserName?.charAt(0) || '?'}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-gray-900 font-medium">
                        {endorsement.fromUserName || 'Anonymous'}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-0.5">
                        "{endorsement.message}"
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        {formatTimeAgo(new Date(endorsement.timestamp).toISOString())}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </Animated.View>

          {/* Safety disclaimer */}
          <View className="mx-4 mt-4 bg-blue-50 rounded-xl p-4">
            <Text className="text-blue-800 font-semibold text-sm mb-1">
              Safety Tips
            </Text>
            <Text className="text-blue-700 text-xs leading-5">
              - Meet in public for initial discussions{'\n'}
              - Agree on price before work begins{'\n'}
              - Pay only after work is completed{'\n'}
              - Trust your instincts
            </Text>
          </View>
        </ScrollView>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowErrorModal(false)}
        >
          <Pressable
            className="flex-1 bg-black/50 items-center justify-center"
            onPress={() => setShowErrorModal(false)}
          >
            <View className="bg-white rounded-2xl p-6 mx-6 max-w-sm w-full">
              <View className="flex-row items-center mb-3">
                <AlertCircle size={24} color="#ef4444" />
                <Text className="text-gray-900 font-bold text-lg ml-2">
                  Oops!
                </Text>
              </View>
              <Text className="text-gray-600 mb-4">{errorMessage}</Text>
              <Pressable
                onPress={() => setShowErrorModal(false)}
                className="bg-gray-100 rounded-lg py-3 items-center"
              >
                <Text className="text-gray-700 font-medium">Got it</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </>
  );
}
