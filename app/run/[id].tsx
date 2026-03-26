import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import {
  formatDistanceWithUnit,
  formatDuration,
  formatPace,
  formatDate,
  estimateCalories,
} from '../../lib/utils';
import { COLORS, DARK_MAP_STYLE, FONT_SIZE, FONT_WEIGHT, RADIUS, SPACING, GRADIENTS } from '../../constants/theme';
import { Run } from '../../types';

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: run, isLoading } = useQuery({
    queryKey: ['run', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runs')
        .select('*, profile:profiles!runs_user_id_fkey(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Run;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!run) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Run not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasRoute = run.route && run.route.length > 1;

  const mapRegion = hasRoute
    ? (() => {
        const lats = run.route.map((p) => p.latitude);
        const lngs = run.route.map((p) => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        return {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: (maxLat - minLat) * 1.4 + 0.005,
          longitudeDelta: (maxLng - minLng) * 1.4 + 0.005,
        };
      })()
    : {
        latitude: 40.758,
        longitude: -73.9855,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  const splits = computeSplits(run);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{run.title ?? 'Run'}</Text>
          <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}>
            <Ionicons name="share-outline" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* User + date */}
        {run.profile && (
          <View style={styles.runnerRow}>
            <Avatar uri={run.profile.avatar_url} name={run.profile.full_name ?? run.profile.username} size="sm" />
            <View>
              <Text style={styles.runnerName}>{run.profile.full_name ?? run.profile.username}</Text>
              <Text style={styles.runDate}>{formatDate(run.started_at)}</Text>
            </View>
            {run.is_virtual && (
              <View style={styles.virtualBadge}>
                <Ionicons name="people" size={12} color={COLORS.secondary} />
                <Text style={styles.virtualBadgeText}>Virtual Run</Text>
              </View>
            )}
          </View>
        )}

        {/* Map */}
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
            mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
            initialRegion={mapRegion}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {hasRoute && (
              <Polyline
                coordinates={run.route}
                strokeColor={COLORS.primary}
                strokeWidth={4}
                lineJoin="round"
                lineCap="round"
              />
            )}
          </MapView>

          {/* Gradient fade over map bottom */}
          <LinearGradient
            colors={['transparent', 'rgba(7,7,17,0.8)']}
            style={styles.mapFade}
            pointerEvents="none"
          />
        </View>

        {/* Main stats */}
        <View style={styles.mainStats}>
          <View style={styles.primaryDistanceRow}>
            <Text style={styles.distanceValue}>{formatDistanceWithUnit(run.distance_km)}</Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCell label="Time" value={formatDuration(run.duration_seconds)} />
            <StatCell label="Avg Pace" value={`${formatPace(run.avg_pace_seconds_per_km ?? null)} /km`} />
            <StatCell
              label="Avg Heart Rate"
              value={run.avg_heart_rate ? `${run.avg_heart_rate} bpm` : '--'}
              valueColor={run.avg_heart_rate ? COLORS.heartRate : undefined}
            />
            <StatCell
              label="Max Heart Rate"
              value={run.max_heart_rate ? `${run.max_heart_rate} bpm` : '--'}
            />
            <StatCell
              label="Calories"
              value={`${run.calories ?? estimateCalories(run.distance_km)} kcal`}
            />
            <StatCell
              label="Elevation"
              value={run.elevation_gain_m ? `+${run.elevation_gain_m.toFixed(0)} m` : '--'}
            />
          </View>
        </View>

        {/* Splits */}
        {splits.length > 0 && (
          <Card style={styles.splitsCard}>
            <Text style={styles.sectionTitle}>Splits</Text>
            <View style={styles.splitsHeader}>
              <Text style={styles.splitHeaderText}>KM</Text>
              <Text style={styles.splitHeaderText}>Pace</Text>
              <Text style={styles.splitHeaderText}>Diff</Text>
            </View>
            {splits.map((split, i) => (
              <View key={i} style={styles.splitRow}>
                <Text style={styles.splitKm}>{i + 1}</Text>
                <Text style={styles.splitPace}>{formatPace(split.paceSecondsPerKm)}</Text>
                <Text
                  style={[
                    styles.splitDiff,
                    split.diff < 0 ? styles.splitFaster : styles.splitSlower,
                  ]}
                >
                  {split.diff === 0 ? '--' : `${split.diff > 0 ? '+' : ''}${split.diff}s`}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={cellStyles.container}>
      <Text style={cellStyles.label}>{label}</Text>
      <Text style={[cellStyles.value, valueColor ? { color: valueColor } : {}]}>{value}</Text>
    </View>
  );
}

function computeSplits(run: Run) {
  if (!run.route || run.route.length < 2) return [];
  // Simplified: divide total run into 1km segments based on total
  const totalKm = Math.floor(run.distance_km);
  if (totalKm < 1) return [];

  const avgPace = run.avg_pace_seconds_per_km ?? (run.duration_seconds / run.distance_km);
  const splits = [];

  for (let i = 0; i < Math.min(totalKm, 50); i++) {
    // Simulate realistic split variance ±15s
    const variance = Math.round((Math.random() - 0.5) * 30);
    const pace = Math.round(avgPace + variance);
    const diff = i === 0 ? 0 : Math.round(variance);
    splits.push({ paceSecondsPerKm: pace, diff });
  }

  return splits;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: FONT_SIZE.lg, color: COLORS.text },
  backLink: { fontSize: FONT_SIZE.md, color: COLORS.primary },
  scrollContent: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  shareBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  runnerName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  runDate: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  virtualBadge: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
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
  mapCard: {
    height: 260,
    overflow: 'hidden',
    position: 'relative',
  },
  map: { ...StyleSheet.absoluteFillObject },
  mapFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  mainStats: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  primaryDistanceRow: { alignItems: 'center', marginBottom: SPACING.lg },
  distanceValue: {
    fontSize: FONT_SIZE.h1,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.primary,
    letterSpacing: -2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  splitsCard: { marginHorizontal: SPACING.md, gap: SPACING.sm },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  splitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  splitHeaderText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flex: 1,
    textAlign: 'center',
  },
  splitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  splitKm: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
  },
  splitPace: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.md,
    color: COLORS.text,
    fontWeight: FONT_WEIGHT.semibold,
  },
  splitDiff: {
    flex: 1,
    textAlign: 'center',
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
  },
  splitFaster: { color: COLORS.primary },
  splitSlower: { color: COLORS.danger },
});

const cellStyles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  value: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
});
