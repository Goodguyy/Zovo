import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Filter, Search, X, ChevronDown } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useAppStore, NIGERIAN_AREAS, SKILL_TAGS } from '@/lib/store';
import { PostCard } from '@/components/PostCard';
import { cn } from '@/lib/cn';

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const posts = useAppStore((s) => s.posts);
  const incrementShareCount = useAppStore((s) => s.incrementShareCount);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const filteredPosts = posts
    .filter((post) => {
      if (selectedArea && post.area !== selectedArea) return false;
      if (selectedSkill && !post.skills.includes(selectedSkill)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleShare = async (post: typeof posts[0]) => {
    try {
      const result = await Share.share({
        message: `Check out ${post.caption.substring(0, 100)}... on HustleWall!\n\nSkills: ${post.skills.join(', ')}\nArea: ${post.area}`,
        title: 'Share on WhatsApp',
      });
      if (result.action === Share.sharedAction) {
        incrementShareCount(post.id);
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const clearFilters = () => {
    setSelectedArea(null);
    setSelectedSkill(null);
  };

  const hasFilters = selectedArea || selectedSkill;

  return (
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
            <Text className="text-white text-2xl font-bold">HustleWall</Text>
          </View>
          <Pressable
            onPress={() => setShowFilters(!showFilters)}
            className={cn(
              "w-10 h-10 rounded-full items-center justify-center",
              showFilters ? "bg-white" : "bg-white/20"
            )}
          >
            <Filter size={20} color={showFilters ? "#059669" : "#fff"} />
          </Pressable>
        </View>

        {/* Filter indicators */}
        {hasFilters && !showFilters && (
          <Animated.View
            entering={FadeIn}
            className="flex-row items-center mt-3 flex-wrap gap-2"
          >
            {selectedArea && (
              <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-white text-xs font-medium">{selectedArea}</Text>
                <Pressable onPress={() => setSelectedArea(null)} className="ml-1.5">
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            )}
            {selectedSkill && (
              <View className="bg-white/20 rounded-full px-3 py-1.5 flex-row items-center">
                <Text className="text-white text-xs font-medium">{selectedSkill}</Text>
                <Pressable onPress={() => setSelectedSkill(null)} className="ml-1.5">
                  <X size={14} color="#fff" />
                </Pressable>
              </View>
            )}
          </Animated.View>
        )}
      </LinearGradient>

      {/* Filters Panel */}
      {showFilters && (
        <Animated.View
          entering={SlideInDown.springify()}
          className="bg-white border-b border-gray-200 px-4 py-4"
        >
          {/* Area filter */}
          <Text className="text-gray-900 font-semibold mb-2">Filter by Area</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
            style={{ flexGrow: 0 }}
          >
            <View className="flex-row gap-2">
              {NIGERIAN_AREAS.slice(0, 12).map((area) => (
                <Pressable
                  key={area}
                  onPress={() => setSelectedArea(selectedArea === area ? null : area)}
                  className={cn(
                    "px-3 py-2 rounded-full border",
                    selectedArea === area
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      selectedArea === area ? "text-white" : "text-gray-700"
                    )}
                  >
                    {area}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {/* Skill filter */}
          <Text className="text-gray-900 font-semibold mb-2">Filter by Skill</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0 }}
          >
            <View className="flex-row gap-2">
              {SKILL_TAGS.slice(0, 15).map((skill) => (
                <Pressable
                  key={skill}
                  onPress={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
                  className={cn(
                    "px-3 py-2 rounded-full border",
                    selectedSkill === skill
                      ? "bg-emerald-500 border-emerald-500"
                      : "bg-white border-gray-200"
                  )}
                >
                  <Text
                    className={cn(
                      "text-sm font-medium",
                      selectedSkill === skill ? "text-white" : "text-gray-700"
                    )}
                  >
                    {skill}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

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
        {filteredPosts.length === 0 ? (
          <Animated.View
            entering={FadeInDown}
            className="flex-1 items-center justify-center py-20"
          >
            <Text className="text-gray-400 text-lg font-medium mb-2">
              No posts found
            </Text>
            <Text className="text-gray-400 text-sm text-center px-8">
              {hasFilters
                ? "Try adjusting your filters to see more results"
                : "Be the first to post your work!"}
            </Text>
            {hasFilters && (
              <Pressable
                onPress={clearFilters}
                className="mt-4 bg-emerald-500 rounded-full px-6 py-2.5"
              >
                <Text className="text-white font-semibold">Clear filters</Text>
              </Pressable>
            )}
          </Animated.View>
        ) : (
          filteredPosts.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              onShare={() => handleShare(post)}
            />
          ))
        )}

        {/* Safety disclaimer */}
        <View className="bg-amber-50 rounded-xl p-4 mt-4 mb-8">
          <Text className="text-amber-800 font-semibold text-sm mb-1">
            Safety Notice
          </Text>
          <Text className="text-amber-700 text-xs leading-5">
            HustleWall connects you with skilled workers. Always verify credentials,
            meet in safe public locations, and agree on payment terms before starting work.
            We do not share precise locations.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
