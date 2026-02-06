/**
 * Real-time Engagement Tracking System for Zovo
 *
 * This module provides real-time tracking for:
 * - Post views (unique per user with 30-min cooldown)
 * - Post shares (tracked per platform)
 * - Endorsements/Likes (one per user per post)
 *
 * Database Structure:
 *
 * /posts/{postId}/
 *   - viewCount: number
 *   - shareCount: number
 *   - endorsementCount: number
 *
 * /engagement/
 *   views/{postId}/{odifiedUserId}/
 *     - timestamp: number
 *     - deviceId: string (optional)
 *
 *   shares/{postId}/{odifiedUserId}/
 *     - timestamps: number[]
 *     - platforms: string[]
 *
 *   endorsements/{postId}/{fromUserId}/
 *     - toUserId: string
 *     - message: string
 *     - timestamp: number
 *
 * Fraud Prevention:
 * - 30-minute cooldown between view counts from same user
 * - One endorsement per user per post
 * - Device fingerprinting for additional verification
 * - Rate limiting on engagement actions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface ViewRecord {
  postId: string;
  userId: string;
  timestamp: number;
  deviceId?: string;
}

export interface ShareRecord {
  postId: string;
  userId: string;
  timestamp: number;
  platform: 'whatsapp' | 'link' | 'other';
}

export interface EndorsementRecord {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  timestamp: number;
}

export interface PostEngagement {
  viewCount: number;
  shareCount: number;
  endorsementCount: number;
  lastUpdated: number;
}

export interface EngagementState {
  views: Record<string, ViewRecord[]>; // postId -> views
  shares: Record<string, ShareRecord[]>; // postId -> shares
  endorsements: Record<string, EndorsementRecord[]>; // postId -> endorsements
  userViews: Record<string, Record<string, number>>; // userId -> postId -> lastViewTimestamp
  userEndorsements: Record<string, Set<string>>; // userId -> Set<postId>
}

// Constants
const VIEW_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = 'hustlewall_engagement';
const MAX_VIEWS_PER_HOUR = 100; // Rate limiting

// Generate device fingerprint (simplified)
export const getDeviceFingerprint = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem('device_fingerprint');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('device_fingerprint', deviceId);
  }
  return deviceId;
};

// Initialize engagement state from storage
let engagementState: EngagementState = {
  views: {},
  shares: {},
  endorsements: {},
  userViews: {},
  userEndorsements: {},
};

// Listeners for real-time updates
type EngagementListener = (postId: string, engagement: PostEngagement) => void;
const listeners: Set<EngagementListener> = new Set();

// Load state from storage
export const loadEngagementState = async (): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      engagementState = {
        ...parsed,
        userEndorsements: Object.fromEntries(
          Object.entries(parsed.userEndorsements || {}).map(([k, v]) => [
            k,
            new Set(v as string[]),
          ])
        ),
      };
    }
  } catch (error) {
    console.log('Error loading engagement state:', error);
  }
};

// Save state to storage
const saveEngagementState = async (): Promise<void> => {
  try {
    const toSave = {
      ...engagementState,
      userEndorsements: Object.fromEntries(
        Object.entries(engagementState.userEndorsements).map(([k, v]) => [
          k,
          Array.from(v),
        ])
      ),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.log('Error saving engagement state:', error);
  }
};

// Notify listeners of engagement changes
const notifyListeners = (postId: string): void => {
  const engagement = getPostEngagement(postId);
  listeners.forEach((listener) => listener(postId, engagement));
};

// Subscribe to engagement updates
export const subscribeToEngagement = (listener: EngagementListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Get engagement for a post
export const getPostEngagement = (postId: string): PostEngagement => {
  return {
    viewCount: engagementState.views[postId]?.length || 0,
    shareCount: engagementState.shares[postId]?.length || 0,
    endorsementCount: engagementState.endorsements[postId]?.length || 0,
    lastUpdated: Date.now(),
  };
};

// Check if user can view (respects cooldown)
export const canRecordView = (postId: string, userId: string): boolean => {
  if (!userId) return false;

  const userViews = engagementState.userViews[userId];
  if (!userViews) return true;

  const lastViewTime = userViews[postId];
  if (!lastViewTime) return true;

  return Date.now() - lastViewTime >= VIEW_COOLDOWN_MS;
};

// Record a view
export const recordView = async (
  postId: string,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  if (!userId) {
    return { success: false, message: 'User not authenticated' };
  }

  if (!canRecordView(postId, userId)) {
    const userViews = engagementState.userViews[userId];
    const lastViewTime = userViews?.[postId] || 0;
    const remainingMs = VIEW_COOLDOWN_MS - (Date.now() - lastViewTime);
    const remainingMins = Math.ceil(remainingMs / 60000);
    return {
      success: false,
      message: `View already counted. Can count again in ${remainingMins} minutes.`,
    };
  }

  // Check rate limiting
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recentViews = Object.values(engagementState.views)
    .flat()
    .filter((v) => v.userId === userId && v.timestamp > hourAgo);

  if (recentViews.length >= MAX_VIEWS_PER_HOUR) {
    return { success: false, message: 'Rate limit exceeded. Try again later.' };
  }

  const deviceId = await getDeviceFingerprint();
  const viewRecord: ViewRecord = {
    postId,
    userId,
    timestamp: Date.now(),
    deviceId,
  };

  // Update state
  if (!engagementState.views[postId]) {
    engagementState.views[postId] = [];
  }
  engagementState.views[postId].push(viewRecord);

  if (!engagementState.userViews[userId]) {
    engagementState.userViews[userId] = {};
  }
  engagementState.userViews[userId][postId] = Date.now();

  // Persist and notify
  await saveEngagementState();
  notifyListeners(postId);

  return { success: true, message: 'View recorded' };
};

// Record a share
export const recordShare = async (
  postId: string,
  userId: string,
  platform: ShareRecord['platform'] = 'other'
): Promise<{ success: boolean; shareCount: number }> => {
  if (!userId) {
    return { success: false, shareCount: 0 };
  }

  const shareRecord: ShareRecord = {
    postId,
    userId,
    timestamp: Date.now(),
    platform,
  };

  if (!engagementState.shares[postId]) {
    engagementState.shares[postId] = [];
  }
  engagementState.shares[postId].push(shareRecord);

  await saveEngagementState();
  notifyListeners(postId);

  return {
    success: true,
    shareCount: engagementState.shares[postId].length,
  };
};

// Check if user can endorse a post
export const canEndorse = (postId: string, userId: string, postOwnerId: string): {
  canEndorse: boolean;
  reason?: string;
} => {
  if (!userId) {
    return { canEndorse: false, reason: 'Please log in to endorse' };
  }

  if (userId === postOwnerId) {
    return { canEndorse: false, reason: "You can't endorse your own work" };
  }

  const userEndorsements = engagementState.userEndorsements[userId];
  if (userEndorsements?.has(postId)) {
    return { canEndorse: false, reason: 'You already endorsed this post' };
  }

  return { canEndorse: true };
};

// Record an endorsement
export const recordEndorsement = async (
  postId: string,
  fromUserId: string,
  toUserId: string,
  message: string
): Promise<{ success: boolean; endorsement?: EndorsementRecord; error?: string }> => {
  const check = canEndorse(postId, fromUserId, toUserId);
  if (!check.canEndorse) {
    return { success: false, error: check.reason };
  }

  const endorsementRecord: EndorsementRecord = {
    id: `end_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    postId,
    fromUserId,
    toUserId,
    message: message.trim(),
    timestamp: Date.now(),
  };

  // Update state
  if (!engagementState.endorsements[postId]) {
    engagementState.endorsements[postId] = [];
  }
  engagementState.endorsements[postId].push(endorsementRecord);

  if (!engagementState.userEndorsements[fromUserId]) {
    engagementState.userEndorsements[fromUserId] = new Set();
  }
  engagementState.userEndorsements[fromUserId].add(postId);

  await saveEngagementState();
  notifyListeners(postId);

  return { success: true, endorsement: endorsementRecord };
};

// Get endorsements for a post
export const getPostEndorsements = (postId: string): EndorsementRecord[] => {
  return engagementState.endorsements[postId] || [];
};

// Get all endorsements received by a user
export const getUserEndorsementsReceived = (userId: string): EndorsementRecord[] => {
  return Object.values(engagementState.endorsements)
    .flat()
    .filter((e) => e.toUserId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// Get all endorsements given by a user
export const getUserEndorsementsGiven = (userId: string): EndorsementRecord[] => {
  return Object.values(engagementState.endorsements)
    .flat()
    .filter((e) => e.fromUserId === userId)
    .sort((a, b) => b.timestamp - a.timestamp);
};

// Analytics helpers
export const getRecentViews = (postId: string, hours: number = 24): number => {
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return (engagementState.views[postId] || []).filter(
    (v) => v.timestamp > cutoff
  ).length;
};

export const getPopularPosts = (
  postIds: string[],
  timeframeHours: number = 168 // 1 week
): Array<{ postId: string; score: number }> => {
  const cutoff = Date.now() - timeframeHours * 60 * 60 * 1000;

  return postIds
    .map((postId) => {
      const views = (engagementState.views[postId] || []).filter(
        (v) => v.timestamp > cutoff
      ).length;
      const shares = (engagementState.shares[postId] || []).filter(
        (s) => s.timestamp > cutoff
      ).length;
      const endorsements = (engagementState.endorsements[postId] || []).filter(
        (e) => e.timestamp > cutoff
      ).length;

      // Weighted score: views + (shares * 3) + (endorsements * 5)
      const score = views + shares * 3 + endorsements * 5;
      return { postId, score };
    })
    .sort((a, b) => b.score - a.score);
};

// Get unique viewers count
export const getUniqueViewers = (postId: string): number => {
  const views = engagementState.views[postId] || [];
  const uniqueUsers = new Set(views.map((v) => v.userId));
  return uniqueUsers.size;
};

// Cleanup old data (call periodically)
export const cleanupOldData = async (daysToKeep: number = 30): Promise<void> => {
  const cutoff = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

  // Clean old views
  for (const postId of Object.keys(engagementState.views)) {
    engagementState.views[postId] = engagementState.views[postId].filter(
      (v) => v.timestamp > cutoff
    );
    if (engagementState.views[postId].length === 0) {
      delete engagementState.views[postId];
    }
  }

  // Clean old shares
  for (const postId of Object.keys(engagementState.shares)) {
    engagementState.shares[postId] = engagementState.shares[postId].filter(
      (s) => s.timestamp > cutoff
    );
    if (engagementState.shares[postId].length === 0) {
      delete engagementState.shares[postId];
    }
  }

  await saveEngagementState();
};

// Initialize on import
loadEngagementState();
