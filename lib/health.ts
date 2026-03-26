/**
 * Health & Apple Watch integration.
 *
 * On iOS, health data flows through HealthKit. The react-native-health library
 * provides access to heart rate, step count, active calories, and more.
 * Apple Watch syncs its sensor data to iPhone via HealthKit automatically.
 *
 * On Android, Health Connect (successor to Google Fit) provides similar access.
 * This module wraps both platforms with a unified API.
 */

import { Platform } from 'react-native';

// Dynamically import react-native-health only on iOS
let AppleHealthKit: any = null;
if (Platform.OS === 'ios') {
  try {
    AppleHealthKit = require('react-native-health').default;
  } catch {
    // react-native-health not available in Expo Go — use bare workflow / dev build
  }
}

const HEALTH_PERMS = AppleHealthKit
  ? {
      permissions: {
        read: [
          AppleHealthKit.Constants.Permissions.HeartRate,
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.StepCount,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.Workout,
        ],
        write: [
          AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
          AppleHealthKit.Constants.Permissions.DistanceWalkingRunning,
          AppleHealthKit.Constants.Permissions.Workout,
        ],
      },
    }
  : null;

let healthInitialized = false;

/**
 * Request HealthKit permissions. Call once at app startup on iOS.
 */
export async function initializeHealth(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleHealthKit) return false;
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(HEALTH_PERMS, (err: any) => {
      if (err) {
        console.warn('[Health] HealthKit init failed:', err);
        resolve(false);
      } else {
        healthInitialized = true;
        resolve(true);
      }
    });
  });
}

/**
 * Get the latest heart rate sample (from Apple Watch or chest strap).
 * Returns BPM or null if unavailable.
 */
export async function getLatestHeartRate(): Promise<number | null> {
  if (Platform.OS !== 'ios' || !AppleHealthKit || !healthInitialized) return null;
  return new Promise((resolve) => {
    const options = {
      unit: 'bpm',
      startDate: new Date(Date.now() - 60_000).toISOString(), // last 60s
      endDate: new Date().toISOString(),
      ascending: false,
      limit: 1,
    };
    AppleHealthKit.getHeartRateSamples(options, (err: any, results: any[]) => {
      if (err || !results?.length) return resolve(null);
      resolve(Math.round(results[0].value));
    });
  });
}

/**
 * Save a completed run workout to Apple Health.
 */
export async function saveRunToHealth(params: {
  startDate: Date;
  endDate: Date;
  distanceKm: number;
  calories: number;
}): Promise<void> {
  if (Platform.OS !== 'ios' || !AppleHealthKit || !healthInitialized) return;

  const options = {
    type: 'Running',
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    distance: params.distanceKm * 1000, // meters
    distanceUnit: 'meter',
    energyBurned: params.calories,
    energyBurnedUnit: 'calorie',
  };

  return new Promise((resolve) => {
    AppleHealthKit.saveWorkout(options, (err: any) => {
      if (err) console.warn('[Health] Failed to save workout:', err);
      resolve();
    });
  });
}

/**
 * Get average heart rate over a time range (for a completed run).
 */
export async function getHeartRateForRun(
  startDate: Date,
  endDate: Date,
): Promise<{ avg: number | null; max: number | null }> {
  if (Platform.OS !== 'ios' || !AppleHealthKit || !healthInitialized) {
    return { avg: null, max: null };
  }

  return new Promise((resolve) => {
    const options = {
      unit: 'bpm',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: true,
    };
    AppleHealthKit.getHeartRateSamples(options, (err: any, results: any[]) => {
      if (err || !results?.length) return resolve({ avg: null, max: null });
      const values = results.map((r) => r.value);
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
      const max = Math.round(Math.max(...values));
      resolve({ avg, max });
    });
  });
}

/**
 * Check if HealthKit is available and initialized.
 */
export function isHealthAvailable(): boolean {
  return Platform.OS === 'ios' && !!AppleHealthKit && healthInitialized;
}
