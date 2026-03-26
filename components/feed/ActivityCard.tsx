import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import { formatDistanceWithUnit, formatDuration, formatPace, timeAgo } from '../../lib/utils';
import { toggleLike } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Run } from '../../types';

interface ActivityCardProps {
  run: Run;
  onCommentPress?: () => void;
}

export default function ActivityCard({ run, onCommentPress }: ActivityCardProps) {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [liked, setLiked] = useState(run.user_has_liked ?? false);
  const [likeCount, setLikeCount] = useState(run.like_count ?? 0);

  const handleLike = async () => {
    if (!profile) return;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => (newLiked ? c + 1 : c - 1));
    await toggleLike(run.id, profile.id, liked).catch(console.error);
  };

  const user = run.profile;

  return (
    <Card style={styles.card} padding={0}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/profile/${user?.id ?? run.user_id}`)}
        activeOpacity={0.7}
      >
        <Avatar uri={user?.avatar_url} name={user?.full_name ?? user?.username} size="md" showBorder />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user?.full_name ?? user?.username ?? 'Runner'}</Text>
          <Text style={styles.runMeta}>
            {run.title ?? 'Morning Run'} · {timeAgo(run.created_at)}
          </Text>
        </View>
        {run.is_virtual && (
          <View style={styles.virtualBadge}>
            <Ionicons name="people" size={12} color={COLORS.secondary} />
            <Text style={styles.virtualBadgeText}>Virtual</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Route map preview (placeholder gradient) */}
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={() => router.push(`/run/${run.id}`)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#0d1a0d', '#0a0a14', '#050510']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Stylized route line preview */}
        <View style={styles.routePreview}>
          <View style={styles.routeLine} />
          <View style={styles.routeStartDot} />
          <View style={styles.routeEndDot} />
        </View>
        <View style={styles.mapOverlay}>
          <Text style={styles.mapDistance}>{formatDistanceWithUnit(run.distance_km)}</Text>
        </View>
      </TouchableOpacity>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDistanceWithUnit(run.distance_km)}</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatDuration(run.duration_seconds)}</Text>
          <Text style={styles.statLabel}>Time</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatPace(run.avg_pace_seconds_per_km ?? null)}</Text>
          <Text style={styles.statLabel}>Pace/km</Text>
        </View>
        {run.avg_heart_rate && (
          <>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.heartRateValue]}>
                {run.avg_heart_rate} <Text style={styles.statUnit}>bpm</Text>
              </Text>
              <Text style={styles.statLabel}>Avg HR</Text>
            </View>
          </>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={22}
            color={liked ? COLORS.danger : COLORS.textSecondary}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.textSecondary} />
          {(run.comment_count ?? 0) > 0 && (
            <Text style={styles.actionCount}>{run.comment_count}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.kudosBtn]}
          activeOpacity={0.7}
        >
          <Text style={styles.kudosEmoji}>👊</Text>
          <Text style={styles.kudosText}>Kudos</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  runMeta: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  virtualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  virtualBadgeText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.secondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  mapContainer: {
    height: 140,
    backgroundColor: '#0a0a14',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routePreview: {
    width: '80%',
    height: 60,
    justifyContent: 'center',
  },
  routeLine: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.7,
    transform: [{ scaleX: 0.9 }],
  },
  routeStartDot: {
    position: 'absolute',
    left: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.secondary,
    top: '50%',
    marginTop: -5,
  },
  routeEndDot: {
    position: 'absolute',
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    top: '50%',
    marginTop: -5,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mapDistance: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  statUnit: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.regular,
  },
  heartRateValue: {
    color: COLORS.heartRate,
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderRadius: RADIUS.sm,
  },
  actionCount: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  actionCountLiked: {
    color: COLORS.danger,
  },
  kudosBtn: {
    marginLeft: 'auto',
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  kudosEmoji: {
    fontSize: 14,
  },
  kudosText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
});
