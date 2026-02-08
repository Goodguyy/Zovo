import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Share, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Filter, X, TrendingUp, Camera, Eye, Share2, MapPin, BadgeCheck, Heart, ChevronRight, Briefcase } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAppStore, formatTimeAgo } from '@/lib/store';
import { useSupabasePosts, useSupabaseProfile, type AppPost } from '@/lib/hooks/useSupabaseData';
import { recordShare } from '@/lib/engagement';
import { useEngagement } from '@/lib/useEngagement';
import { LocationPicker } from '@/components/LocationPicker';
import { SkillsPicker } from '@/components/SkillsPicker';

// Web-specific post card component
function WebPostCard({ post, onShare }: { post: AppPost; onShare: () => void }) {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const { profile } = useSupabaseProfile(post.userId);
  const { viewCount, shareCount, endorsementCount, trackView } = useEngagement(post.id, post.userId);

  React.useEffect(() => {
    if (currentUser?.id) trackView();
  }, [currentUser?.id, trackView]);

  if (!profile) return null;

  return (
    <Animated.View entering={FadeInUp.delay(100)} style={styles.card}>
      <Pressable onPress={() => router.push(`/post/${post.id}`)} style={styles.cardInner}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.mediaUrl }} style={styles.image} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.imageGradient} />

          {/* Stats overlay */}
          <View style={styles.statsOverlay}>
            <View style={styles.statBadge}>
              <Eye size={14} color="#fff" />
              <Text style={styles.statText}>{viewCount}</Text>
            </View>
            {shareCount > 0 && (
              <View style={styles.statBadge}>
                <Share2 size={14} color="#fff" />
                <Text style={styles.statText}>{shareCount}</Text>
              </View>
            )}
            {endorsementCount > 0 && (
              <View style={[styles.statBadge, { backgroundColor: 'rgba(245, 158, 11, 0.8)' }]}>
                <Heart size={14} color="#fff" fill="#fff" />
                <Text style={styles.statText}>{endorsementCount}</Text>
              </View>
            )}
          </View>

          {/* Skills */}
          <View style={styles.skillsContainer}>
            {post.skills.slice(0, 3).map((skill) => (
              <View key={skill} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Pressable onPress={() => router.push(`/profile/${post.userId}`)} style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{profile.name}</Text>
                {profile.endorsementCount >= 5 && <BadgeCheck size={16} color="#10b981" />}
              </View>
              <View style={styles.locationRow}>
                <MapPin size={12} color="#6b7280" />
                <Text style={styles.location}>{post.area}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.time}>{formatTimeAgo(post.createdAt)}</Text>
              </View>
            </View>
          </Pressable>

          <Text style={styles.caption} numberOfLines={2}>{post.caption}</Text>

          <View style={styles.actions}>
            <View style={styles.viewDetails}>
              <Text style={styles.viewDetailsText}>View details</Text>
              <ChevronRight size={16} color="#059669" />
            </View>
            <Pressable onPress={onShare} style={styles.shareButton}>
              <Share2 size={14} color="#059669" />
              <Text style={styles.shareText}>Share</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WebFeedScreen() {
  const router = useRouter();
  const currentUser = useAppStore((s) => s.currentUser);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);

  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Build area filter from state + city
  const selectedArea = selectedCity && selectedState
    ? `${selectedCity}, ${selectedState}`
    : selectedCity || selectedState || null;

  // Build skill filter (use first selected skill for filtering)
  const selectedSkill = selectedSkills.length > 0 ? selectedSkills[0] : null;

  const { posts, loading, refetch } = useSupabasePosts({
    area: selectedCity || selectedState || undefined,
    skill: selectedSkill || undefined,
  });

  const filteredPosts = useMemo(() => {
    return [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleShare = async (post: AppPost) => {
    try {
      const result = await Share.share({
        message: `Check out ${post.caption.substring(0, 100)}... on Zovo!`,
        title: 'Share on Zovo',
      });
      if (result.action === Share.sharedAction && currentUser?.id) {
        await recordShare(post.id, currentUser.id, 'other');
      }
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const clearFilters = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSelectedSkills([]);
  };

  const hasFilters = selectedArea || selectedSkill;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.logo}>Zovo</Text>
            <Text style={styles.tagline}>Find skilled workers near you</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            >
              <Filter size={18} color={showFilters ? '#059669' : '#fff'} />
              <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filtersContent}>
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
            <View style={{ marginTop: 16 }}>
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
              <Pressable onPress={clearFilters} style={styles.clearFilters}>
                <Text style={styles.clearFiltersText}>Clear all filters</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Active Filters */}
      {hasFilters && !showFilters && (
        <View style={styles.activeFilters}>
          {selectedArea && (
            <View style={styles.activeFilterChip}>
              <MapPin size={12} color="#059669" />
              <Text style={styles.activeFilterText}>{selectedArea}</Text>
              <Pressable onPress={() => { setSelectedState(null); setSelectedCity(null); }}>
                <X size={14} color="#059669" />
              </Pressable>
            </View>
          )}
          {selectedSkill && (
            <View style={styles.activeFilterChip}>
              <Briefcase size={12} color="#059669" />
              <Text style={styles.activeFilterText}>{selectedSkill}</Text>
              <Pressable onPress={() => setSelectedSkills([])}>
                <X size={14} color="#059669" />
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Notice */}
        <Animated.View entering={FadeInDown} style={styles.notice}>
          <TrendingUp size={18} color="#059669" />
          <Text style={styles.noticeText}>
            All views, shares, and endorsements update in real-time
          </Text>
        </Animated.View>

        {/* Posts Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : filteredPosts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Camera size={40} color="#059669" />
            </View>
            <Text style={styles.emptyTitle}>
              {hasFilters ? 'No posts found' : 'Welcome to Zovo!'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {hasFilters
                ? 'Try adjusting your filters'
                : 'Be the first to showcase your work'}
            </Text>
            {hasFilters ? (
              <Pressable onPress={clearFilters} style={styles.ctaButton}>
                <Text style={styles.ctaText}>Clear filters</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => router.push(isAuthenticated ? '/(tabs)/create' : '/auth')}
                style={styles.ctaButton}
              >
                <Text style={styles.ctaText}>
                  {isAuthenticated ? 'Post Your Work' : 'Sign Up'}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.postsGrid}>
            {filteredPosts.map((post) => (
              <WebPostCard key={post.id} post={post} onShare={() => handleShare(post)} />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Zovo - Connecting skilled workers with opportunities
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#059669',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {},
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 6,
  },
  liveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: '#fff',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: '#059669',
  },
  filtersPanel: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 20,
  },
  filtersContent: {
    maxWidth: 1200,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  clearFilters: {
    marginTop: 8,
  },
  clearFiltersText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  activeFilterText: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  notice: {
    maxWidth: 800,
    width: '100%',
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  noticeText: {
    marginLeft: 10,
    color: '#047857',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6b7280',
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  ctaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  postsGrid: {
    maxWidth: 800,
    width: '100%',
    marginHorizontal: 'auto',
    paddingHorizontal: 24,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardInner: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 220,
    height: 180,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  statsOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  skillsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillTag: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  skillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  profileInfo: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 3,
  },
  dot: {
    color: '#9ca3af',
    marginHorizontal: 4,
  },
  time: {
    fontSize: 12,
    color: '#6b7280',
  },
  caption: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  shareText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  footer: {
    marginTop: 40,
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
