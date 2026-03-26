import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchLeaderboard } from '../../lib/supabase';
import Avatar from '../../components/ui/Avatar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRADIENTS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { LeaderboardEntry } from '../../types';

type Period = 'week' | 'month' | 'alltime';

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  alltime: 'All Time',
};

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const RANK_ICONS: Array<'trophy' | 'medal' | 'ribbon'> = ['trophy', 'medal', 'ribbon'];

export default function LeaderboardScreen() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('week');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
  });

  const currentUserRank = (entries as LeaderboardEntry[]).find(
    (e) => e.user_id === profile?.id,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Ionicons name="trophy" size={24} color={COLORS.warning} />
      </View>

      {/* Period tabs */}
      <View style={styles.periodTabs}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.7}
          >
            <Text style={[styles.periodTabText, period === p && styles.periodTabTextActive]}>
              {PERIOD_LABELS[p]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Your rank banner */}
      {currentUserRank && (
        <LinearGradient
          colors={['rgba(0,245,160,0.12)', 'rgba(0,201,255,0.06)']}
          style={styles.yourRankBanner}
        >
          <Text style={styles.yourRankLabel}>Your Rank</Text>
          <View style={styles.yourRankRow}>
            <Text style={styles.yourRankNumber}>#{currentUserRank.rank}</Text>
            <Text style={styles.yourRankDistance}>
              {currentUserRank.total_distance_km.toFixed(1)} km
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Top 3 Podium */}
      {!isLoading && (entries as LeaderboardEntry[]).length >= 3 && (
        <View style={styles.podium}>
          {/* 2nd place */}
          <PodiumEntry entry={(entries as LeaderboardEntry[])[1]} rank={2} />
          {/* 1st place */}
          <PodiumEntry entry={(entries as LeaderboardEntry[])[0]} rank={1} elevated />
          {/* 3rd place */}
          <PodiumEntry entry={(entries as LeaderboardEntry[])[2]} rank={3} />
        </View>
      )}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={(entries as LeaderboardEntry[]).slice(3)}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <LeaderboardRow entry={item} isCurrentUser={item.user_id === profile?.id} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            (entries as LeaderboardEntry[]).length > 3 ? (
              <Text style={styles.listHeader}>More Runners</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="footsteps-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No data yet — start running!</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </SafeAreaView>
  );
}

function PodiumEntry({
  entry,
  rank,
  elevated,
}: {
  entry: LeaderboardEntry;
  rank: number;
  elevated?: boolean;
}) {
  return (
    <View style={[podiumStyles.container, elevated && podiumStyles.elevated]}>
      <Ionicons name={RANK_ICONS[rank - 1]} size={20} color={RANK_COLORS[rank - 1]} />
      <Avatar uri={entry.avatar_url} name={entry.full_name ?? entry.username} size={elevated ? 'lg' : 'md'} showBorder />
      <Text style={podiumStyles.name} numberOfLines={1}>
        {entry.full_name ?? entry.username}
      </Text>
      <Text style={podiumStyles.distance}>{entry.total_distance_km.toFixed(1)} km</Text>
      <View style={[podiumStyles.podiumBlock, { height: elevated ? 60 : 40 }]}>
        <LinearGradient
          colors={elevated ? GRADIENTS.primary : ['#252540', '#1A1A2E']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={podiumStyles.rankText}>#{rank}</Text>
      </View>
    </View>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <View style={[rowStyles.container, isCurrentUser && rowStyles.highlighted]}>
      <Text style={rowStyles.rank}>#{entry.rank}</Text>
      <Avatar uri={entry.avatar_url} name={entry.full_name ?? entry.username} size="sm" />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name} numberOfLines={1}>
          {entry.full_name ?? entry.username}
          {isCurrentUser && <Text style={rowStyles.you}> (you)</Text>}
        </Text>
        <Text style={rowStyles.runs}>{entry.run_count} runs</Text>
      </View>
      <View style={rowStyles.distanceWrapper}>
        <Text style={rowStyles.distance}>{entry.total_distance_km.toFixed(1)}</Text>
        <Text style={rowStyles.distanceUnit}>km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  periodTabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  periodTabActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  periodTabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  periodTabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  yourRankBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yourRankLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.medium,
  },
  yourRankRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  yourRankNumber: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.primary,
  },
  yourRankDistance: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  listContent: { paddingHorizontal: SPACING.md },
  listHeader: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: SPACING.sm,
  },
  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
});

const podiumStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  elevated: {
    marginBottom: 0,
    paddingBottom: 20,
  },
  name: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
    textAlign: 'center',
    maxWidth: 80,
  },
  distance: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  podiumBlock: {
    width: '100%',
    borderTopLeftRadius: RADIUS.sm,
    borderTopRightRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rankText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
  },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  highlighted: {
    backgroundColor: COLORS.primaryDim,
    marginHorizontal: -SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderColor: 'transparent',
  },
  rank: {
    width: 32,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  info: { flex: 1 },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  you: { color: COLORS.primary },
  runs: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
  distanceWrapper: { alignItems: 'flex-end' },
  distance: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  distanceUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
});
