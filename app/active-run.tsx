import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useRun } from '../hooks/useRun';
import { formatDuration, formatDistance, formatPace } from '../lib/utils';
import { COLORS, DARK_MAP_STYLE, GRADIENTS } from '../constants/theme';

export default function ActiveRunScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const mapRef = useRef<MapView>(null);
  const startedRef = useRef(false);

  const {
    isRunning,
    isPaused,
    durationSeconds,
    distanceKm,
    paceSecondsPerKm,
    calories,
    heartRate,
    routePoints,
    currentLocation,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
  } = useRun();

  // Animation values
  const slideUp = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    slideUp.value = withSpring(1, { damping: 18, stiffness: 100 });
  }, []);

  // Pulse animation for LIVE dot
  useEffect(() => {
    if (isRunning && !isPaused) {
      pulseScale.value = withRepeat(
        withTiming(1.8, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      pulseOpacity.value = withRepeat(
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1);
      pulseOpacity.value = withTiming(1);
    }
  }, [isRunning, isPaused]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(slideUp.value, [0, 1], [300, 0]),
      },
    ],
    opacity: slideUp.value,
  }));

  // Auto-start on mount — guard against double invocation
  useEffect(() => {
    if (!isRunning && !startedRef.current) {
      startedRef.current = true;
      startRun(roomId ?? undefined);
    }
  }, []);

  // Follow user on map
  useEffect(() => {
    if (currentLocation && mapRef.current && isRunning && !isPaused) {
      mapRef.current.animateToRegion(
        {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        },
        600,
      );
    }
  }, [currentLocation, isRunning, isPaused]);

  const handleStop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Finish Run?',
      `You've run ${formatDistance(distanceKm)} km. Ready to save?`,
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Finish & Save',
          style: 'destructive',
          onPress: async () => {
            const saved = await stopRun();
            if (saved) {
              router.replace(`/run/${saved.id}`);
            } else {
              router.replace('/(tabs)');
            }
          },
        },
      ],
    );
  }, [distanceKm, stopRun, router]);

  const handlePauseResume = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isPaused) await resumeRun();
    else await pauseRun();
  }, [isPaused, pauseRun, resumeRun]);

  const initialRegion = {
    latitude: currentLocation?.coords.latitude ?? 40.758,
    longitude: currentLocation?.coords.longitude ?? -73.9855,
    latitudeDelta: 0.004,
    longitudeDelta: 0.004,
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={Platform.OS === 'android' ? DARK_MAP_STYLE : undefined}
        mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        rotateEnabled={false}
        pitchEnabled={false}
        initialRegion={initialRegion}
      >
        {/* Run route */}
        {routePoints.length > 1 && (
          <Polyline
            coordinates={routePoints}
            strokeColor={COLORS.primary}
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        )}

        {/* User location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <Animated.View style={[styles.markerPulse, pulseStyle]} />
              <View style={styles.markerDot} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <View style={styles.topBarContent}>
          {/* Status indicator */}
          {isRunning && !isPaused ? (
            <View style={styles.statusBadge}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          ) : isPaused ? (
            <View style={[styles.statusBadge, styles.pausedBadge]}>
              <Text style={styles.pausedText}>PAUSED</Text>
            </View>
          ) : null}

          {/* Lock screen button */}
          <TouchableOpacity style={styles.lockBtn} activeOpacity={0.75}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Bottom overlay */}
      <Animated.View style={[styles.bottomOverlay, overlayStyle]}>
        {/* Fade gradient */}
        <LinearGradient
          colors={GRADIENTS.screenFade}
          style={styles.fadeGradient}
          pointerEvents="none"
        />

        <View style={styles.statsPanel}>
          {/* Primary distance */}
          <View style={styles.primaryStat}>
            <Text style={styles.primaryStatValue}>{formatDistance(distanceKm)}</Text>
            <Text style={styles.primaryStatUnit}>kilometers</Text>
          </View>

          {/* Secondary stats grid */}
          <View style={styles.secondaryStats}>
            <StatItem
              value={formatDuration(durationSeconds)}
              label="Time"
            />
            <View style={styles.statsDivider} />
            <StatItem
              value={formatPace(paceSecondsPerKm)}
              label="Pace /km"
            />
            <View style={styles.statsDivider} />
            <StatItem
              value={heartRate ? `${heartRate}` : '--'}
              label="BPM"
              valueStyle={heartRate ? styles.heartRateValue : undefined}
            />
            <View style={styles.statsDivider} />
            <StatItem
              value={`${calories}`}
              label="Cal"
            />
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {/* Stop */}
            <TouchableOpacity style={styles.sideControl} onPress={handleStop} activeOpacity={0.75}>
              <View style={styles.sideControlInner}>
                <Ionicons name="stop" size={22} color={COLORS.danger} />
              </View>
              <Text style={styles.controlLabel}>Stop</Text>
            </TouchableOpacity>

            {/* Pause / Resume - main CTA */}
            <TouchableOpacity
              style={styles.mainControl}
              onPress={handlePauseResume}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={
                  isPaused
                    ? ([COLORS.primary, COLORS.primaryDark] as any)
                    : (['#FF4B5C', '#FF8C69'] as any)
                }
                style={styles.mainControlGradient}
              >
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={34}
                  color="#070711"
                />
              </LinearGradient>
            </TouchableOpacity>

            {/* Map recenter */}
            <TouchableOpacity
              style={styles.sideControl}
              activeOpacity={0.75}
              onPress={() => {
                if (currentLocation && mapRef.current) {
                  mapRef.current.animateToRegion({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.004,
                    longitudeDelta: 0.004,
                  }, 500);
                }
              }}
            >
              <View style={styles.sideControlInner}>
                <Ionicons name="locate" size={20} color={COLORS.secondary} />
              </View>
              <Text style={styles.controlLabel}>Center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function StatItem({
  value,
  label,
  valueStyle,
}: {
  value: string;
  label: string;
  valueStyle?: object;
}) {
  return (
    <View style={statStyles.container}>
      <Text style={[statStyles.value, valueStyle]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070711',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBarContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,245,160,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.25)',
  },
  pausedBadge: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.25)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  liveText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  pausedText: {
    color: COLORS.warning,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
  },
  lockBtn: {
    position: 'absolute',
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15,15,26,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  markerContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,245,160,0.25)',
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: '#070711',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  fadeGradient: {
    height: 120,
    marginTop: -120,
  },
  statsPanel: {
    backgroundColor: '#070711',
    paddingTop: 20,
    paddingBottom: 44,
    paddingHorizontal: 20,
  },
  primaryStat: {
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryStatValue: {
    fontSize: 76,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -3,
    lineHeight: 82,
  },
  primaryStatUnit: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  secondaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  statsDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#1A1A2E',
  },
  heartRateValue: {
    color: COLORS.heartRate,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  sideControl: {
    alignItems: 'center',
    gap: 6,
  },
  sideControlInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0F0F1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1A1A2E',
  },
  controlLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  mainControl: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  mainControlGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
