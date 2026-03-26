import { useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useRunStore } from '../store/runStore';
import { useLocation } from './useLocation';
import { haversineDistance, estimateCalories, calculatePace, generateRunTitle } from '../lib/utils';
import { saveRun, updateLiveLocation } from '../lib/supabase';
import { getLatestHeartRate, saveRunToHealth } from '../lib/health';
import { useAuthStore } from '../store/authStore';
import { RoutePoint } from '../types';

export function useRun() {
  const store = useRunStore();
  const { startTracking, stopTracking, currentLocation } = useLocation();
  const { profile } = useAuthStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartRateRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationUnsub = useRef<(() => void) | null>(null);
  const liveLocationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick timer every second
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const { isRunning, isPaused, startTime, pausedDuration, distanceKm } = useRunStore.getState();
      if (!isRunning || isPaused || !startTime) return;

      const elapsed = (Date.now() - startTime) / 1000 - pausedDuration;
      const pace = calculatePace(distanceKm, elapsed);
      const calories = estimateCalories(distanceKm);

      store.updateDuration(Math.floor(elapsed));
      store.updatePace(pace);
      store.updateCalories(calories);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Poll heart rate from HealthKit every 5 seconds
  const startHeartRatePolling = useCallback(() => {
    heartRateRef.current = setInterval(async () => {
      const bpm = await getLatestHeartRate();
      store.updateHeartRate(bpm);
    }, 5000);
  }, []);

  const stopHeartRatePolling = useCallback(() => {
    if (heartRateRef.current) {
      clearInterval(heartRateRef.current);
      heartRateRef.current = null;
    }
  }, []);

  // Broadcast live location to virtual room
  const startLiveBroadcast = useCallback((roomId: string, userId: string) => {
    liveLocationRef.current = setInterval(() => {
      const { distanceKm, durationSeconds, routePoints } = useRunStore.getState();
      const last = routePoints[routePoints.length - 1];
      if (!last) return;
      updateLiveLocation(userId, roomId, last.latitude, last.longitude, distanceKm, durationSeconds).catch(console.error);
    }, 4000);
  }, []);

  const stopLiveBroadcast = useCallback(() => {
    if (liveLocationRef.current) {
      clearInterval(liveLocationRef.current);
      liveLocationRef.current = null;
    }
  }, []);

  const handleLocationUpdate = useCallback((location: Location.LocationObject) => {
    const state = useRunStore.getState();
    if (!state.isRunning || state.isPaused) return;

    const newPoint: RoutePoint = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      timestamp: location.timestamp,
      altitude: location.coords.altitude,
    };

    const points = state.routePoints;
    let newDistance = state.distanceKm;

    if (points.length > 0) {
      const last = points[points.length - 1];
      const segment = haversineDistance(
        last.latitude, last.longitude,
        newPoint.latitude, newPoint.longitude,
      );
      // Filter out GPS noise (ignore jumps < 2m or > 100m)
      if (segment >= 0.002 && segment <= 0.1) {
        newDistance += segment;
      }
    }

    store.addRoutePoint(newPoint, newDistance);
  }, []);

  const startRun = useCallback(async (virtualRoomId?: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    store.startRun(virtualRoomId);
    startTimer();
    startHeartRatePolling();

    locationUnsub.current = await startTracking(handleLocationUpdate);

    if (virtualRoomId && profile) {
      startLiveBroadcast(virtualRoomId, profile.id);
    }
  }, [startTimer, startHeartRatePolling, startTracking, handleLocationUpdate, profile]);

  const pauseRun = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.pauseRun();
  }, []);

  const resumeRun = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.resumeRun();
  }, []);

  const stopRun = useCallback(async () => {
    const state = useRunStore.getState();

    stopTimer();
    stopHeartRatePolling();
    stopLiveBroadcast();
    stopTracking();
    if (locationUnsub.current) locationUnsub.current();

    if (!profile || !state.startTime) {
      store.resetRun();
      return null;
    }

    const startDate = new Date(state.startTime);
    const endDate = new Date();
    const title = generateRunTitle();

    // Save to Apple Health
    await saveRunToHealth({
      startDate,
      endDate,
      distanceKm: state.distanceKm,
      calories: state.calories,
    }).catch(console.error);

    // Save to Supabase
    try {
      const saved = await saveRun({
        user_id: profile.id,
        title,
        distance_km: state.distanceKm,
        duration_seconds: state.durationSeconds,
        avg_pace_seconds_per_km: state.paceSecondsPerKm,
        avg_heart_rate: state.heartRate ?? undefined,
        calories: state.calories,
        route: state.routePoints,
        started_at: startDate.toISOString(),
        ended_at: endDate.toISOString(),
        is_virtual: !!state.virtualRoomId,
        virtual_room_id: state.virtualRoomId ?? undefined,
      });

      store.resetRun();
      return saved;
    } catch (err) {
      console.error('[useRun] Failed to save run:', err);
      store.resetRun();
      return null;
    }
  }, [profile, stopTimer, stopHeartRatePolling, stopLiveBroadcast, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      stopHeartRatePolling();
      stopLiveBroadcast();
      if (locationUnsub.current) locationUnsub.current();
    };
  }, []);

  return {
    isRunning: store.isRunning,
    isPaused: store.isPaused,
    durationSeconds: store.durationSeconds,
    distanceKm: store.distanceKm,
    paceSecondsPerKm: store.paceSecondsPerKm,
    calories: store.calories,
    heartRate: store.heartRate,
    routePoints: store.routePoints,
    virtualRoomId: store.virtualRoomId,
    currentLocation,
    startRun,
    pauseRun,
    resumeRun,
    stopRun,
  };
}
