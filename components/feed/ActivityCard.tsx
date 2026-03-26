import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import Avatar from '../ui/Avatar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING } from '../../constants/theme';
import { formatDistanceWithUnit, formatDuration, formatPace, timeAgo } from '../../lib/utils';
import { toggleLike } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Run, RoutePoint } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - SPACING.md * 2;
const MAP_HEIGHT = 170;
const SVG_PADDING = 24;

interface ActivityCardProps {
  run: Run;
  onCommentPress?: () => void;
}

function RouteArt({ route }: { route: RoutePoint[] }) {
  if (!route || route.length < 2) {
    return (
      <LinearGradient
        colors={['#0a0a18', '#060612', '#0a0a18']}
        style={[StyleSheet.absoluteFillObject, styles.fallbackRoute]}
      >
        <View style={styles.fallbackLine} />
        <View style={styles.fallbackDotStart} />
        <View style={styles.fallbackDotEnd} />
      </LinearGradient>
    );
  }

  const W = CARD_WIDTH;
  const H = MAP_HEIGHT;
  const lats = route.map((p) => p.latitude);
  const lngs = route.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.0001;
  const lngRange = maxLng - minLng || 0.0001;

  const points = route
    .map((p) => {
      const x = SVG_PADDING + ((p.longitude - minLng) / lngRange) * (W - SVG_PADDING * 2);
      const y = SVG_PADDING + ((maxLat - p.latitude) / latRange) * (H - SVG_PADDING * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const start = route[0];
  const end = route[route.length - 1];
  const startX = SVG_PADDING + ((start.longitude - minLng) / lngRange) * (W - SVG_PADDING * 2);
  const startY = SVG_PADDING + ((maxLat - start.latitude) / latRange) * (H - SVG_PADDING * 2);
  const endX = SVG_PADDING + ((end.longitude - minLng) / lngRange) * (W - SVG_PADDING * 2);
  const endY = SVG_PADDING + ((maxLat - end.latitude) / latRange) * (H - SVG_PADDING * 2);

  return (
    <>
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#07070F' }]} />
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <SvgGradient id="rg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#00C9FF" stopOpacity="0.95" />
            <Stop offset="1" stopColor="#00F5A0" stopOpacity="0.95" />
          </SvgGradient>
        </Defs>
        {/* Glow pass */}
        <Polyline
          points={points}
          stroke="rgba(0,245,160,0.15)"
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Route line */}
        <Polyline
          points={points}
          stroke="url(#rg)"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Start halo */}
        <Circle cx={startX} cy={startY} r={8} fill="rgba(0,201,255,0.18)" />
        <Circle cx={startX} cy={startY} r={4} fill="#00C9FF" />
        {/* End halo */}
        <Circle cx={endX} cy={endY} r={8} fill="rgba(0,245,160,0.18)" />
        <Circle cx={endX} cy={endY} r={4} fill="#00F5A0" />
      </Svg>
    </>
  );
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
    <View style={styles.card}>
      {/* ── HEADER ── */}
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push(`/profile/${user?.id ?? run.user_id}`)}
        activeOpacity={0.7}
      >
        <Avatar uri={user?.avatar_url} name={user?.full_name ?? user?.username} size="md" showBorder />
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>{user?.full_name ?? user?.username ?? 'Runner'}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.runTitle}>{run.title ?? 'Morning Run'}</Text>
            <Text style={styles.metaDot}> · </Text>
            <Text style={styles.runTime}>{timeAgo(run.created_at)}</Text>
          </View>
        </View>
        {run.is_virtual && (
          <View style={styles.virtualBadge}>
            <Ionicons name="people" size={11} color={COLORS.secondary} />
            <Text style={styles.virtualBadgeText}>Virtual</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── ROUTE ART ── */}
      <TouchableOpacity
        style={styles.mapContainer}
        onPress={() => router.push(`/run/${run.id}`)}
        activeOpacity={0.88}
      >
        <RouteArt route={run.route ?? []} />
        {/* Distance overlay */}
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceBadgeText}>{formatDistanceWithUnit(run.distance_km)}</Text>
        </View>
        {/* Pace overlay */}
        <View style={styles.paceBadge}>
          <Ionicons name="flash-outline" size={10} color={COLORS.textMuted} />
          <Text style={styles.paceBadgeText}>{formatPace(run.avg_pace_seconds_per_km ?? null)}/km</Text>
        </View>
        {/* Bottom gradient for smooth transition */}
        <LinearGradient
          colors={['transparent', 'rgba(15,15,26,0.7)']}
          style={styles.mapBottomFade}
          pointerEvents="none"
        />
      </TouchableOpacity>

      {/* ── STATS ROW ── */}
      <View style={styles.statsRow}>
        <StatItem
          icon="expand-outline"
          value={formatDistanceWithUnit(run.distance_km)}
          label="Distance"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="time-outline"
          value={formatDuration(run.duration_seconds)}
          label="Time"
        />
        <View style={styles.statDivider} />
        <StatItem
          icon="speedometer-outline"
          value={formatPace(run.avg_pace_seconds_per_km ?? null)}
          label="Pace/km"
        />
        {run.avg_heart_rate ? (
          <>
            <View style={styles.statDivider} />
            <StatItem
              icon="heart-outline"
              value={`${run.avg_heart_rate}`}
              label="Avg HR"
              valueColor={COLORS.heartRate}
              unit="bpm"
            />
          </>
        ) : run.calories ? (
          <>
            <View style={styles.statDivider} />
            <StatItem
              icon="flame-outline"
              value={`${run.calories}`}
              label="Cal"
            />
          </>
        ) : null}
      </View>

      {/* ── ACTIONS ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={21}
            color={liked ? COLORS.danger : COLORS.textSecondary}
          />
          {likeCount > 0 && (
            <Text style={[styles.actionCount, liked && styles.actionCountLiked]}>
              {likeCount}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onCommentPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={19} color={COLORS.textSecondary} />
          {(run.comment_count ?? 0) > 0 && (
            <Text style={styles.actionCount}>{run.comment_count}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-redo-outline" size={19} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.kudosBtn]} activeOpacity={0.75}>
          <Ionicons name="flash" size={13} color={COLORS.primary} />
          <Text style={styles.kudosText}>Kudos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatItem({
  icon, value, label, valueColor, unit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  valueColor?: string;
  unit?: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={13} color={COLORS.textMuted} style={{ marginBottom: 3 }} />
      <Text style={[styles.statValue, valueColor ? { color: valueColor } : null]}>
        {value}
        {unit && <Text style={styles.statUnit}> {unit}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  runTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  metaDot: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
  },
  runTime: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
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
    borderColor: 'rgba(0,201,255,0.3)',
  },
  virtualBadgeText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3,
  },

  // Route map
  mapContainer: {
    height: MAP_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  fallbackRoute: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackLine: {
    width: '70%',
    height: 2.5,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
  fallbackDotStart: {
    position: 'absolute',
    left: '15%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
  },
  fallbackDotEnd: {
    position: 'absolute',
    right: '15%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  distanceBadgeText: {
    color: COLORS.text,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
  },
  paceBadge: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  paceBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: FONT_WEIGHT.medium,
  },
  mapBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  statUnit: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.regular,
    color: COLORS.textMuted,
  },
  statLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: FONT_WEIGHT.medium,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 2,
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
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.25)',
  },
  kudosText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.2,
  },
});
