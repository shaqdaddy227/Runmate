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
import Card from '../../components/ui/Card';
import WeeklyChart from '../../components/profile/WeeklyChart';
import AchievementBadge from '../../components/profile/AchievementBadge';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRADIENTS } from '../../constants/theme';
import { formatDistanceWithUnit, formatDuration, formatPace, timeAgo, getAchievementMeta } from '../../lib/utils';
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
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Profile Hero */}
        <LinearGradient
          colors={['rgba(0,245,160,0.08)', 'transparent']}
          style={styles.heroGradient}
        >
          <View style={styles.heroHeader}>
            <TouchableOpacity style={styles.settingsBtn} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7}>
              <Ionicons name="settings-outline" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.avatarSection}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name ?? profile?.username}
              size="xl"
              showBorder
            />
            <Text style={styles.fullName}>{profile?.full_name ?? profile?.username}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          </View>

          {/* All-time stats */}
          <View style={styles.allTimeStats}>
            <View style={styles.allTimeStat}>
              <Text style={styles.allTimeValue}>{totalKm.toFixed(0)}</Text>
              <Text style={styles.allTimeLabel}>km total</Text>
            </View>
            <View style={styles.allTimeStatDivider} />
            <View style={styles.allTimeStat}>
              <Text style={styles.allTimeValue}>{totalRuns}</Text>
              <Text style={styles.allTimeLabel}>runs</Text>
            </View>
            <View style={styles.allTimeStatDivider} />
            <View style={styles.allTimeStat}>
              <Text style={styles.allTimeValue}>{formatDuration(totalTime)}</Text>
              <Text style={styles.allTimeLabel}>total time</Text>
            </View>
            <View style={styles.allTimeStatDivider} />
            <View style={styles.allTimeStat}>
              <Text style={styles.allTimeValue}>{formatPace(avgPaceAll)}</Text>
              <Text style={styles.allTimeLabel}>avg pace</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Weekly Chart */}
        <Card style={styles.weeklyCard}>
          <WeeklyChart data={weekData} goalKm={profile?.weekly_goal_km ?? 5} />
        </Card>

        {/* Achievements */}
        {(achievements as Achievement[]).length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionAction}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
              {(achievements as Achievement[]).map((a) => (
                <AchievementBadge key={a.id} achievement={a} style={{ marginRight: SPACING.md }} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Runs */}
        {(runs as Run[]).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>All Runs</Text>
            {(runs as Run[]).slice(0, 10).map((run) => (
              <TouchableOpacity
                key={run.id}
                onPress={() => router.push(`/run/${run.id}`)}
                activeOpacity={0.75}
              >
                <View style={styles.runRow}>
                  <View style={styles.runLeft}>
                    <View style={styles.runIconWrapper}>
                      <Ionicons name="footsteps" size={16} color={COLORS.primary} />
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
                  <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: 40 },
  heroGradient: { paddingBottom: SPACING.md },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    gap: SPACING.sm,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarSection: { alignItems: 'center', paddingBottom: SPACING.md },
  fullName: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    marginTop: SPACING.sm,
    letterSpacing: -0.5,
  },
  username: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  bio: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  allTimeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.bgCard,
    marginHorizontal: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  allTimeStat: { alignItems: 'center', flex: 1 },
  allTimeValue: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  allTimeLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  allTimeStatDivider: { width: 1, height: 32, backgroundColor: COLORS.border },
  weeklyCard: { marginHorizontal: SPACING.md, marginTop: SPACING.md },
  section: { paddingHorizontal: SPACING.md, marginTop: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  sectionAction: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  badgesScroll: { overflow: 'visible' },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  runLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  runIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  runDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
  runRight: { alignItems: 'flex-end', marginRight: SPACING.xs },
  runDistance: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  runTime: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted },
});
