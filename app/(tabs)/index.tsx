import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useLocation } from '../../hooks/useLocation';
import { fetchUserRuns } from '../../lib/supabase';
import { formatDistanceWithUnit, formatDuration, formatPace, timeAgo } from '../../lib/utils';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import WeeklyChart from '../../components/profile/WeeklyChart';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRADIENTS } from '../../constants/theme';
import { Run } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function buildWeekData(runs: Run[]) {
  const days = Array(7).fill(0).map(() => ({ distance_km: 0 }));
  const now = new Date();
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  startOfWeek.setHours(0, 0, 0, 0);

  for (const run of runs) {
    const runDate = new Date(run.started_at);
    if (runDate >= startOfWeek) {
      const diff = Math.floor((runDate.getTime() - startOfWeek.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        days[diff].distance_km += run.distance_km;
      }
    }
  }
  return days;
}

export default function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const { hasPermission, requestPermissions } = useLocation();

  const { data: runs = [] } = useQuery({
    queryKey: ['userRuns', profile?.id],
    queryFn: () => fetchUserRuns(profile!.id),
    enabled: !!profile?.id,
  });

  const weekData = buildWeekData(runs as Run[]);
  const weekKm = weekData.reduce((s, d) => s + d.distance_km, 0);
  const weekRuns = (runs as Run[]).filter((r) => {
    const d = new Date(r.started_at);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 86400000;
    return diff < 7;
  }).length;

  const handleStartRun = useCallback(async () => {
    if (!hasPermission) {
      await requestPermissions();
    }
    router.push('/active-run');
  }, [hasPermission, requestPermissions, router]);

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'Runner';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background glow */}
      <View style={styles.bgGlow} pointerEvents="none" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
            <Text style={styles.name}>{firstName} 👋</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.8}
          >
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name ?? profile?.username}
              size="md"
              showBorder
            />
          </TouchableOpacity>
        </View>

        {/* This Week Summary */}
        <Card style={styles.weekCard}>
          <View style={styles.weekStatsRow}>
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>{weekKm.toFixed(1)}</Text>
              <Text style={styles.weekStatLabel}>km this week</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>{weekRuns}</Text>
              <Text style={styles.weekStatLabel}>runs</Text>
            </View>
            <View style={styles.weekStatDivider} />
            <View style={styles.weekStat}>
              <Text style={styles.weekStatValue}>
                {profile?.total_runs ?? 0}
              </Text>
              <Text style={styles.weekStatLabel}>total runs</Text>
            </View>
          </View>

          {/* Weekly goal progress */}
          {(profile?.weekly_goal_km ?? 0) > 0 && (
            <View style={styles.goalSection}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalLabel}>Weekly Goal</Text>
                <Text style={styles.goalNumbers}>
                  {weekKm.toFixed(1)} / {profile!.weekly_goal_km} km
                </Text>
              </View>
              <View style={styles.goalTrack}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.goalFill,
                    {
                      width: `${Math.min(
                        (weekKm / profile!.weekly_goal_km) * 100,
                        100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          <WeeklyChart data={weekData} goalKm={profile?.weekly_goal_km ?? 5} />
        </Card>

        {/* START RUN button */}
        <TouchableOpacity
          style={styles.startRunBtn}
          onPress={handleStartRun}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startRunGradient}
          >
            <View style={styles.startRunIconWrapper}>
              <Ionicons name="play" size={28} color="#070711" />
            </View>
            <View>
              <Text style={styles.startRunTitle}>Start Run</Text>
              <Text style={styles.startRunSub}>Tap to begin tracking</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(7,7,17,0.6)" style={{ marginLeft: 'auto' }} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/friends')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.secondaryDim }]}>
              <Ionicons name="people" size={20} color={COLORS.secondary} />
            </View>
            <Text style={styles.quickActionLabel}>Virtual Run</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/leaderboard')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.accentDim }]}>
              <Ionicons name="trophy" size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.quickActionLabel}>Leaderboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/feed')}
            activeOpacity={0.75}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: COLORS.dangerGlow }]}>
              <Ionicons name="flame" size={20} color={COLORS.danger} />
            </View>
            <Text style={styles.quickActionLabel}>Activity Feed</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Runs */}
        {(runs as Run[]).length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Runs</Text>
            {(runs as Run[]).slice(0, 5).map((run) => (
              <TouchableOpacity
                key={run.id}
                onPress={() => router.push(`/run/${run.id}`)}
                activeOpacity={0.75}
              >
                <Card style={styles.runItem} padding={14}>
                  <View style={styles.runItemLeft}>
                    <View style={styles.runIcon}>
                      <Ionicons name="footsteps" size={18} color={COLORS.primary} />
                    </View>
                    <View>
                      <Text style={styles.runTitle}>{run.title ?? 'Run'}</Text>
                      <Text style={styles.runDate}>{timeAgo(run.started_at)}</Text>
                    </View>
                  </View>
                  <View style={styles.runItemRight}>
                    <Text style={styles.runDistance}>{formatDistanceWithUnit(run.distance_km)}</Text>
                    <Text style={styles.runPace}>{formatPace(run.avg_pace_seconds_per_km ?? null)} /km</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  bgGlow: {
    position: 'absolute',
    top: 0,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.3,
  },
  scrollContent: { paddingHorizontal: SPACING.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  name: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  weekCard: { marginBottom: SPACING.md },
  weekStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  weekStat: { flex: 1, alignItems: 'center' },
  weekStatValue: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  weekStatLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  weekStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  goalSection: { marginBottom: SPACING.md },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  goalLabel: { fontSize: FONT_SIZE.sm, color: COLORS.textSecondary, fontWeight: FONT_WEIGHT.medium },
  goalNumbers: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
  goalTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', borderRadius: RADIUS.full },
  startRunBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    ...{
      shadowColor: COLORS.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 10,
    },
  },
  startRunGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  startRunIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(7,7,17,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startRunTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.black,
    color: '#070711',
    letterSpacing: -0.3,
  },
  startRunSub: { fontSize: FONT_SIZE.sm, color: 'rgba(7,7,17,0.6)' },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
  recentSection: { gap: SPACING.sm },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  runItem: { marginBottom: 0 },
  runItemLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  runIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  runDate: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
  runItemRight: { alignItems: 'flex-end' },
  runDistance: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  runPace: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 1 },
});
