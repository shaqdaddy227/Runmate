import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import Avatar from '../../components/ui/Avatar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS, GRADIENTS } from '../../constants/theme';
import { Run } from '../../types';

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
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
    const diff = (Date.now() - new Date(r.started_at).getTime()) / 86400000;
    return diff < 7;
  }).length;

  const goalKm = profile?.weekly_goal_km ?? 0;
  const goalProgress = goalKm > 0 ? Math.min(weekKm / goalKm, 1) : 0;

  const handleStartRun = useCallback(async () => {
    if (!hasPermission) {
      await requestPermissions();
    }
    router.push('/active-run');
  }, [hasPermission, requestPermissions, router]);

  const firstName = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'Runner';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{firstName}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.8}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name ?? profile?.username}
              size="md"
              showBorder
            />
          </TouchableOpacity>
        </View>

        {/* ── START RUN HERO ── */}
        <TouchableOpacity
          style={styles.heroCard}
          onPress={handleStartRun}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['rgba(0,245,160,0.10)', 'rgba(0,201,255,0.04)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            {/* Left: this week stats */}
            <View style={styles.heroStats}>
              <Text style={styles.heroWeekLabel}>THIS WEEK</Text>
              <Text style={styles.heroKmValue}>{weekKm.toFixed(1)}</Text>
              <Text style={styles.heroKmUnit}>km</Text>
              <View style={styles.heroStatsDivider} />
              <Text style={styles.heroRunCount}>{weekRuns}</Text>
              <Text style={styles.heroRunLabel}>{weekRuns === 1 ? 'run' : 'runs'}</Text>
            </View>

            {/* Vertical separator */}
            <View style={styles.heroSeparator} />

            {/* Right: play CTA */}
            <View style={styles.heroAction}>
              <View style={styles.heroPlayRing}>
                <LinearGradient
                  colors={GRADIENTS.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroPlayGradient}
                >
                  <Ionicons name="play" size={30} color={COLORS.bg} />
                </LinearGradient>
              </View>
              <Text style={styles.heroStartLabel}>START RUN</Text>
              <Text style={styles.heroStartSub}>Tap to begin</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ── GOAL PROGRESS ── */}
        {goalKm > 0 && (
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={styles.goalLeft}>
                <Ionicons name="flag-outline" size={14} color={COLORS.primary} />
                <Text style={styles.goalTitle}>Weekly Goal</Text>
              </View>
              <Text style={styles.goalNumbers}>
                {weekKm.toFixed(1)} / {goalKm} km
              </Text>
            </View>
            <View style={styles.goalTrack}>
              <LinearGradient
                colors={GRADIENTS.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.goalFill, { width: `${goalProgress * 100}%` }]}
              />
            </View>
            <Text style={styles.goalPercent}>{Math.round(goalProgress * 100)}% complete</Text>
          </View>
        )}

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="people"
            label="Virtual Run"
            color={COLORS.secondary}
            dimColor={COLORS.secondaryDim}
            onPress={() => router.push('/(tabs)/friends')}
          />
          <QuickAction
            icon="trophy"
            label="Leaderboard"
            color={COLORS.accent}
            dimColor={COLORS.accentDim}
            onPress={() => router.push('/(tabs)/leaderboard')}
          />
          <QuickAction
            icon="flame"
            label="Activity Feed"
            color={COLORS.danger}
            dimColor={COLORS.dangerGlow}
            onPress={() => router.push('/(tabs)/feed')}
          />
        </View>

        {/* ── RECENT RUNS ── */}
        {(runs as Run[]).length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} activeOpacity={0.7}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {(runs as Run[]).slice(0, 5).map((run, i) => (
              <TouchableOpacity
                key={run.id}
                onPress={() => router.push(`/run/${run.id}`)}
                activeOpacity={0.72}
                style={[styles.runRow, i === 0 && styles.runRowFirst]}
              >
                <View style={styles.runIconBox}>
                  <Ionicons name="footsteps" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.runInfo}>
                  <Text style={styles.runTitle}>{run.title ?? 'Run'}</Text>
                  <Text style={styles.runMeta}>
                    {timeAgo(run.started_at)} · {formatDuration(run.duration_seconds)}
                  </Text>
                </View>
                <View style={styles.runRight}>
                  <Text style={styles.runDistance}>{formatDistanceWithUnit(run.distance_km)}</Text>
                  <Text style={styles.runPace}>{formatPace(run.avg_pace_seconds_per_km ?? null)}/km</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(runs as Run[]).length === 0 && (
          <View style={styles.emptyRuns}>
            <Ionicons name="footsteps-outline" size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No runs yet — go crush it!</Text>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon, label, color, dimColor, onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  dimColor: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: dimColor, borderColor: `${color}30` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  greeting: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.2,
  },
  name: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.8,
    marginTop: 1,
  },

  // Hero card
  heroCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.18)',
    backgroundColor: '#0C0C1A',
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingVertical: 28,
  },
  heroStats: {
    flex: 1,
  },
  heroWeekLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroKmValue: {
    fontSize: 54,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -2,
    lineHeight: 56,
  },
  heroKmUnit: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 1,
    marginTop: 2,
  },
  heroStatsDivider: {
    width: 20,
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  heroRunCount: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.extrabold,
    color: COLORS.text,
  },
  heroRunLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  heroSeparator: {
    width: 1,
    height: 80,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.lg,
  },
  heroAction: {
    alignItems: 'center',
    gap: 10,
  },
  heroPlayRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 14,
  },
  heroPlayGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStartLabel: {
    fontSize: 10,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  heroStartSub: {
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginTop: -4,
  },

  // Goal card
  goalCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: SPACING.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  goalTitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  goalNumbers: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  goalTrack: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: 6,
  },
  goalFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  goalPercent: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.3,
  },

  // Quick actions
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
    paddingVertical: 14,
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.semibold,
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  // Recent runs
  recentSection: {
    gap: 0,
  },
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
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  runRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  runRowFirst: {
    borderTopColor: 'transparent',
  },
  runIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.15)',
  },
  runInfo: {
    flex: 1,
  },
  runTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  runMeta: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  runRight: {
    alignItems: 'flex-end',
  },
  runDistance: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  runPace: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Empty state
  emptyRuns: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
});
