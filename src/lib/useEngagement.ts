/**
 * useEngagement Hook
 *
 * Real-time engagement tracking hook for HustleWall posts.
 * Provides live-updating view, share, and endorsement counts.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PostEngagement,
  EndorsementRecord,
  subscribeToEngagement,
  getPostEngagement,
  getPostEndorsements,
  recordView,
  recordShare,
  recordEndorsement,
  canRecordView,
  canEndorse,
  getRecentViews,
  getUniqueViewers,
  loadEngagementState,
} from './engagement';
import { useAppStore } from './store';

interface UseEngagementReturn {
  // Engagement data
  viewCount: number;
  shareCount: number;
  endorsementCount: number;
  endorsements: EndorsementRecord[];
  uniqueViewers: number;
  recentViews24h: number;

  // Status flags
  isLoading: boolean;
  hasViewed: boolean;
  hasEndorsed: boolean;
  canUserEndorse: boolean;
  endorseBlockReason?: string;

  // Actions
  trackView: () => Promise<void>;
  trackShare: (platform?: 'whatsapp' | 'link' | 'other') => Promise<void>;
  submitEndorsement: (message: string) => Promise<{ success: boolean; error?: string }>;

  // Refresh
  refresh: () => void;
}

export function useEngagement(postId: string, postOwnerId?: string): UseEngagementReturn {
  const currentUser = useAppStore((s) => s.currentUser);
  const userId = currentUser?.id;

  const [engagement, setEngagement] = useState<PostEngagement>({
    viewCount: 0,
    shareCount: 0,
    endorsementCount: 0,
    lastUpdated: Date.now(),
  });
  const [endorsements, setEndorsements] = useState<EndorsementRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasViewed, setHasViewed] = useState(false);
  const viewTrackedRef = useRef(false);

  // Check if user can endorse
  const endorseCheck = postOwnerId && userId
    ? canEndorse(postId, userId, postOwnerId)
    : { canEndorse: false, reason: 'Please log in to endorse' };

  // Load initial data
  const loadData = useCallback(async () => {
    await loadEngagementState();
    const data = getPostEngagement(postId);
    const postEndorsements = getPostEndorsements(postId);
    setEngagement(data);
    setEndorsements(postEndorsements);
    setIsLoading(false);
  }, [postId]);

  // Subscribe to real-time updates
  useEffect(() => {
    loadData();

    const unsubscribe = subscribeToEngagement((updatedPostId, updatedEngagement) => {
      if (updatedPostId === postId) {
        setEngagement(updatedEngagement);
        setEndorsements(getPostEndorsements(postId));
      }
    });

    return () => unsubscribe();
  }, [postId, loadData]);

  // Track view
  const trackView = useCallback(async () => {
    if (!userId || viewTrackedRef.current || !canRecordView(postId, userId)) {
      return;
    }

    viewTrackedRef.current = true;
    const result = await recordView(postId, userId);

    if (result.success) {
      setHasViewed(true);
    }
  }, [postId, userId]);

  // Track share
  const trackShare = useCallback(
    async (platform: 'whatsapp' | 'link' | 'other' = 'other') => {
      if (!userId) return;
      await recordShare(postId, userId, platform);
    },
    [postId, userId]
  );

  // Submit endorsement
  const submitEndorsement = useCallback(
    async (message: string): Promise<{ success: boolean; error?: string }> => {
      if (!userId || !postOwnerId) {
        return { success: false, error: 'Please log in to endorse' };
      }

      const result = await recordEndorsement(postId, userId, postOwnerId, message);

      if (result.success) {
        return { success: true };
      }

      return { success: false, error: result.error };
    },
    [postId, userId, postOwnerId]
  );

  // Refresh data
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    viewCount: engagement.viewCount,
    shareCount: engagement.shareCount,
    endorsementCount: engagement.endorsementCount,
    endorsements,
    uniqueViewers: getUniqueViewers(postId),
    recentViews24h: getRecentViews(postId, 24),

    isLoading,
    hasViewed,
    hasEndorsed: endorseCheck.canEndorse === false && (endorseCheck.reason?.includes('already') ?? false),
    canUserEndorse: endorseCheck.canEndorse,
    endorseBlockReason: endorseCheck.reason,

    trackView,
    trackShare,
    submitEndorsement,
    refresh,
  };
}

/**
 * usePostViewTracker
 *
 * Simple hook for tracking post views in feed.
 * Uses IntersectionObserver-like behavior for scroll tracking.
 */
export function usePostViewTracker(postId: string) {
  const currentUser = useAppStore((s) => s.currentUser);
  const viewedRef = useRef(false);

  const onVisible = useCallback(async () => {
    if (viewedRef.current || !currentUser?.id) return;

    viewedRef.current = true;
    await recordView(postId, currentUser.id);
  }, [postId, currentUser?.id]);

  return { onVisible };
}

/**
 * useEngagementStats
 *
 * Get aggregated engagement stats for a user's profile.
 */
export function useEngagementStats(userId: string) {
  const posts = useAppStore((s) => s.posts);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalShares: 0,
    totalEndorsements: 0,
    postsCount: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      await loadEngagementState();

      const userPosts = posts.filter((p) => p.userId === userId);
      let totalViews = 0;
      let totalShares = 0;
      let totalEndorsements = 0;

      for (const post of userPosts) {
        const engagement = getPostEngagement(post.id);
        totalViews += engagement.viewCount;
        totalShares += engagement.shareCount;
        totalEndorsements += engagement.endorsementCount;
      }

      setStats({
        totalViews,
        totalShares,
        totalEndorsements,
        postsCount: userPosts.length,
      });
    };

    loadStats();

    // Subscribe to updates
    const unsubscribe = subscribeToEngagement(() => {
      loadStats();
    });

    return () => unsubscribe();
  }, [userId, posts]);

  return stats;
}
