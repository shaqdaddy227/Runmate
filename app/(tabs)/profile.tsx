import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase, fetchUserRuns } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import WeeklyChart from '../../components/profile/WeeklyChart';
import AchievementBadge from '../../components/profile/AchievementBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRADIENTS } from '../../constants/theme';
import { formatDistanceWithUnit, formatDuration, formatPace, timeAgo } from '../../lib/utils';
import { Run, Achievement } from '../../types';

function buildWeekData(runs: Run[]) {
  const days = Array(7).fill(0).map(() => ({ distance_km: 0 }));
  const now = new Date();
  const dow = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  startOfWeek.setHours(0, 0, 0, 0);
  for (const run of runs) {
    const d = new Date(run.started_at);
    if (d >= startOfWeek) {
      const idx = Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000);
      if (idx >= 0 && idx < 7) days[idx].distance_km += run.distance_km;
    }
  }
  return days;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const { data: runs = [] } = useQuery({
    queryKey: ['userRuns', profile?.id],
    queryFn: () => fetchUserRuns(profile!.id, 50),
    enabled: !!profile?.id,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', profile!.id)
        .order('earned_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!profile?.id,
  });

  const weekData = buildWeekData(runs as Run[]);
  const totalKm = profile?.total_distance_km ?? 0;
  const totalRuns = profile?.total_runs ?? 0;
  const totalTime = profile?.total_duration_seconds ?? 0;
  const avgPaceAll = totalKm > 0 ? totalTime / totalKm : 0;

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── HERO SECTION ── */}
        <View style={styles.hero}>
          {/* Ambient glow */}
          <View style={styles.heroGlow} pointerEvents="none" />

          {/* Header actions */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Avatar + identity */}
          <View style={styles.identity}>
            <View style={styles.avatarWrapper}>
              <LinearGradient
                colors={GRADIENTS.primary}
                style={styles.avatarRing}
              >
                <Avatar
                  uri={profile?.avatar_url}
                  name={profile?.full_name ?? profile?.username}
                  size="xl"
                />
              </LinearGradient>
            </View>
            <Text style={styles.fullName}>{profile?.full_name ?? profile?.username}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            {profile?.bio ? (
              <Text style={styles.bio}>{profile.bio}</Text>
            ) : null}
          </View>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <StatCell
              value={totalKm >= 1000 ? `${(totalKm / 1000).toFixed(1)}k` : totalKm.toFixed(0)}
              unit="km"
              label="Total Distance"
              color={COLORS.primary}
            />
            <View style={styles.statsCellDivider} />
            <StatCell
              value={`${totalRuns}`}
              unit=""
              label="Total Runs"
              color={COLORS.secondary}
            />
            <View style={styles.statsCellDivider} />
            <StatCell
              value={formatDuration(totalTime)}
              unit=""
              label="Total Time"
              color={COLORS.accent}
            />
            <View style={styles.statsCellDivider} />
            <StatCell
              value={formatPace(avgPaceAll)}
              unit="/km"
              label="Avg Pace"
              color={COLORS.warning}
            />
          </View>
        </View>

        {/* ── WEEKLY CHART ── */}
        <View style={styles.section}>
          <View style={styles.chartCard}>
            <WeeklyChart data={weekData} goalKm={profile?.weekly_goal_km ?? 5} />
          </View>
        </View>

        {/* ── ACHIEVEMENTS ── */}
        {(achievements as Achievement[]).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <View style={styles.achievementCountBadge}>
                <Text style={styles.achievementCountText}>{achievements.length}</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {(achievements as Achievement[]).map((a) => (
                <AchievementBadge key={a.id} achievement={a} style={{ marginRight: SPACING.sm }} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── RUN HISTORY ── */}
        {(runs as Run[]).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Run History</Text>
            <View style={styles.runList}>
              {(runs as Run[]).slice(0, 12).map((run, i) => (
                <TouchableOpacity
                  key={run.id}
                  onPress={() => router.push(`/run/${run.id}`)}
                  activeOpacity={0.72}
                >
                  <View style={[styles.runRow, i === 0 && styles.runRowFirst]}>
                    <View style={styles.runLeft}>
                      <View style={styles.runIconBox}>
                        <Ionicons name="footsteps" size={15} color={COLORS.primary} />
                      </View>
                      <View>
                        <Text style={styles.runTitle}>{run.title ?? 'Run'}</Text>
                        <Text style={styles.runDate}>{timeAgo(run.started_at)}</Text>
                      </View>
                    </View>
                    <View style={styles.runRight}>
                      <Text style={styles.runDistance}>{formatDistanceWithUnit(run.distance_km)}</Text>
                      <Text style={styles.runTime}>{formatDuration(run.duration_seconds)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {(runs as Run[]).length === 0 && (
          <View style={styles.emptyRuns}>
            <Ionicons name="footsteps-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No runs yet</Text>
            <Text style={styles.emptySubtext}>Your run history will appear here</Text>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({
  value, unit, label, color,
}: {
  value: string;
  unit: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statsCell}>
      <View style={styles.statsCellValueRow}>
        <Text style={[styles.statsCellValue, { color }]}>{value}</Text>
        {unit ? <Text style={styles.statsCellUnit}>{unit}</Text> : null}
      </View>
      <Text style={styles.statsCellLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  // Hero
  hero: {
    position: 'relative',
    paddingBottom: SPACING.md,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    left: '50%',
    marginLeft: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.25,
  },
  heroActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  identity: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  avatarWrapper: {
    marginBottom: SPACING.sm,
  },
  avatarRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  username: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    lineHeight: 20,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  statsCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  statsCellValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  statsCellValue: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.black,
    letterSpacing: -0.5,
  },
  statsCellUnit: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  statsCellLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 3,
    fontWeight: FONT_WEIGHT.medium,
  },
  statsCellDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.border,
  },

  // Sections
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  achievementCountBadge: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.2)',
  },
  achievementCountText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  achievementsScroll: {
    paddingBottom: 4,
  },

  // Chart
  chartCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },

  // Run list
  runList: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 13,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  runRowFirst: {
    borderTopWidth: 0,
  },
  runLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  runIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.12)',
  },
  runTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  runDate: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  runRight: {
    alignItems: 'flex-end',
    marginRight: SPACING.xs,
  },
  runDistance: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  runTime: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 1,
  },

  // Empty
  emptyRuns: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  emptyText: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
