import { useEffect, useRef, useState, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  currentLocation: Location.LocationObject | null;
  hasPermission: boolean;
  isTracking: boolean;
  error: string | null;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    hasPermission: false,
    isTracking: false,
    error: null,
  });

  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      // Check if already granted first
      const { status: existing } = await Location.getForegroundPermissionsAsync();
      if (existing === 'granted') {
        setState((s) => ({ ...s, hasPermission: true }));
        return true;
      }

      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setState((s) => ({ ...s, hasPermission: false, error: 'Location permission denied' }));
        return false;
      }

      setState((s) => ({ ...s, hasPermission: true }));
      return true;
    } catch (err) {
      console.warn('[Location] Permission request failed:', err);
      setState((s) => ({ ...s, hasPermission: false }));
      return false;
    }
  }, []);

  // Get initial position
  const getInitialPosition = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState((s) => ({ ...s, currentLocation: location }));
    } catch (err) {
      console.warn('[Location] Failed to get initial position:', err);
    }
  }, []);

  /**
   * Start continuous GPS tracking (called during active run).
   * Returns an unsubscribe function.
   */
  const startTracking = useCallback(
    async (onLocation: (location: Location.LocationObject) => void): Promise<() => void> => {
      if (watchRef.current) {
        watchRef.current.remove();
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 3000,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          setState((s) => ({ ...s, currentLocation: location, isTracking: true }));
          onLocation(location);
        },
      );

      watchRef.current = subscription;
      setState((s) => ({ ...s, isTracking: true }));

      return () => {
        subscription.remove();
        watchRef.current = null;
        setState((s) => ({ ...s, isTracking: false }));
      };
    },
    [],
  );

  const stopTracking = useCallback(() => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setState((s) => ({ ...s, isTracking: false }));
  }, []);

  useEffect(() => {
    // Only check existing permission status on mount — do not prompt
    Location.getForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status === 'granted') {
          setState((s) => ({ ...s, hasPermission: true }));
          getInitialPosition();
        }
      })
      .catch(() => {});

    return () => {
      watchRef.current?.remove();
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    requestPermissions,
  };
}
