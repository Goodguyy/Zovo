import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Filter, X, TrendingUp, Camera, MapPin, Briefcase, Search } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { useSupabasePosts } from '@/lib/hooks/useSupabaseData';
import { recordShare } from '@/lib/engagement';
import { PostCard } from '@/components/PostCard';
import { WebContainer } from '@/components/WebContainer';
import { LocationPicker } from '@/components/LocationPicker';
import { SkillsPicker } from '@/components/SkillsPicker';
import { cn } from '@/lib/cn';
import * as Haptics from 'expo-haptics';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const feedFilters = useAppStore((s) => s.feedFilters);
  const setFeedFilters = useAppStore((s) => s.setFeedFilters);
  const clearFeedFiltersStore = useAppStore((s) => s.clearFeedFilters);

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Use persisted filter values
  const selectedState = feedFilters.state;
  const selectedCity = feedFilters.city;
  const selectedSkills = feedFilters.skills;
  const searchQuery = feedFilters.searchQuery;

  // Setters that update the store
  const setSelectedState = (value: string | null) => setFeedFilters({ state: value });
  const setSelectedCity = (value: string | null) => setFeedFilters({ city: value });
  const setSelectedSkills = (value: string[]) => setFeedFilters({ skills: value });
  const setSearchQuery = (value: string) => setFeedFilters({ searchQuery: value });

  // Build area filter from state + city
  const selectedArea = selectedCity && selectedState
    ? `${selectedCity}, ${selectedState}`
    : selectedCity || selectedState || null;

  // Build skill filter (use first selected skill for filtering)
  const selectedSkill = selectedSkills.length > 0 ? selectedSkills[0] : null;

  // Fetch posts from Supabase with pagination
  const { posts, loading, loadingMore, hasMore, refetch, loadMore } = useSupabasePosts({
    area: selectedCity || selectedState || undefined,
    skill: selectedSkill || undefined,
    pageSize: 20,
  });

  // Posts are already filtered by the hook, apply search filter and sort by date
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(post =>
        post.caption.toLowerCase().includes(query) ||
        post.skills.some(skill => skill.toLowerCase().includes(query)) ||
        post.area.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = async (post: (typeof posts)[0]) => {
    try {
      const result = await Share.share({
        message: `Check out ${post.caption.substring(0, 100)}... on Zovo!\n\nSkills: ${post.skills.join(', ')}\nArea: ${post.area}\n\nFind skilled workers on Zovo!`,
        title: 'Share on WhatsApp',
      });
      if (result.action === Share.sharedAction && currentUser?.id) {
        // Track the share in real-time engagement system
        await recordShare(post.id, currentUser.id, 'other');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const clearFilters = () => {
    clearFeedFiltersStore();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const hasFilters = selectedArea || selectedSkill || searchQuery.trim();

  return (
    <WebContainer>
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
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white/80 text-sm font-medium">Welcome to</Text>
            <Text className="text-white text-2xl font-bold">Zovo</Text>
          </View>
          <View className="flex-row items-center gap-2">
            {/* Live indicator */}
            <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-400 mr-1.5" />
              <Text className="text-white text-xs font-medium">Live</Text>
            </View>
            <Pressable
              onPress={() => {
                setShowFilters(!showFilters);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={cn(
                "w-10 h-10 rounded-full items-center justify-center",
                showFilters ? "bg-white" : "bg-white/20"
              )}
            >
              <Filter size={20} color={showFilters ? "#059669" : "#fff"} />
            </Pressable>
          </View>
        </View>

        {/* Filter indicators */}
        {hasFilters && !showFilters && (
          <Animated.View
            entering={FadeIn}
            className="flex-row items-center mt-3 flex-wrap gap-2"
          >
            {selectedArea && (
              <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
                <MapPin size={12} color="#fff" />
                <Text className="text-white text-xs font-medium ml-1">{selectedArea}</Text>
                <Pressable onPress={() => { setSelectedState(null); setSelectedCity(null); }} className="ml-1.5">
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            )}
            {selectedSkill && (
              <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
                <Briefcase size={12} color="#fff" />
                <Text className="text-white text-xs font-medium ml-1">{selectedSkill}</Text>
                <Pressable onPress={() => setSelectedSkills([])} className="ml-1.5">
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </LinearGradient>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Search size={20} color="#9ca3af" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search skills, areas, or keywords..."
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-gray-900 text-base"
            returnKeyType="search"
          />
          {searchQuery.trim() && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <Animated.View
          entering={SlideInDown.springify()}
          className="bg-white border-b border-gray-200 px-4 py-4"
        >
          {/* Location filter */}
          <LocationPicker
            state={selectedState}
            city={selectedCity}
            onStateChange={setSelectedState}
            onCityChange={setSelectedCity}
            label="Filter by Location"
            allowCustom={true}
          />

          {/* Skill filter */}
          <View className="mt-4">
            <SkillsPicker
              selectedSkills={selectedSkills}
              onSkillsChange={setSelectedSkills}
              label="Filter by Skill"
              singleSelect={true}
              allowCustom={true}
            />
          </View>

          {/* Clear filters */}
          {hasFilters && (
            <Pressable
              onPress={clearFilters}
              className="mt-4 items-center"
            >
              <Text className="text-emerald-600 font-medium">Clear all filters</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* Feed */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#059669"
            colors={['#059669']}
          />
        }
      >
        {/* Real-time notice */}
        <Animated.View
          entering={FadeInDown}
          className="bg-emerald-50 rounded-xl p-3 mb-4 flex-row items-center"
        >
          <TrendingUp size={18} color="#059669" />
          <Text className="text-emerald-700 text-sm ml-2 flex-1">
            All views, shares, and endorsements update in real-time
          </Text>
        </Animated.View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="text-gray-500 mt-4">Loading posts...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <Animated.View
            entering={FadeInDown}
            className="flex-1 items-center justify-center py-16"
          >
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <Camera size={36} color="#059669" />
            </View>
            <Text className="text-gray-900 text-xl font-bold mb-2">
              {hasFilters ? "No posts found" : "Welcome to Zovo!"}
            </Text>
            <Text className="text-gray-500 text-sm text-center px-8 mb-6">
              {hasFilters
                ? "Try adjusting your filters to see more results"
                : "Be the first to showcase your work and connect with customers in your area."}
            </Text>
            {hasFilters ? (
              <Pressable
                onPress={clearFilters}
                className="bg-emerald-500 rounded-full px-6 py-3"
              >
                <Text className="text-white font-semibold">Clear filters</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  if (isAuthenticated) {
                    router.push('/(tabs)/create');
                  } else {
                    router.push('/auth');
                  }
                }}
                className="bg-emerald-500 rounded-full px-6 py-3"
              >
                <Text className="text-white font-semibold">
                  {isAuthenticated ? "Post Your First Work" : "Sign Up to Get Started"}
                </Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          <>
            {filteredPosts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                index={index}
                onShare={() => handleShare(post)}
              />
            ))}
            {/* Load More Button */}
            {hasMore && (
              <Pressable
                onPress={loadMore}
                disabled={loadingMore}
                className="bg-emerald-100 rounded-xl py-4 items-center mb-4"
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#059669" />
                ) : (
                  <Text className="text-emerald-700 font-semibold">Load More</Text>
                )}
              </Pressable>
            )}
          </>
        )}

        {/* Safety disclaimer */}
        <View className="bg-amber-50 rounded-xl p-4 mt-4 mb-8">
          <Text className="text-amber-800 font-semibold text-sm mb-1">
            Safety Notice
          </Text>
          <Text className="text-amber-700 text-xs leading-5">
            Zovo connects you with skilled workers. Always verify credentials,
            meet in safe public locations, and agree on payment terms before starting work.
            We do not share precise locations.
          </Text>
        </View>
      </ScrollView>
      </View>
    </WebContainer>
  );
}
