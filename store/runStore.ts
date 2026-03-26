import { create } from 'zustand';
import { RoutePoint } from '../types';

interface RunStore {
  // State
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pauseTime: number | null;
  pausedDuration: number; // accumulated paused seconds
  distanceKm: number;
  routePoints: RoutePoint[];
  heartRate: number | null;
  virtualRoomId: string | null;

  // Derived (updated by hook)
  durationSeconds: number;
  paceSecondsPerKm: number;
  calories: number;

  // Actions
  startRun: (virtualRoomId?: string) => void;
  pauseRun: () => void;
  resumeRun: () => void;
  addRoutePoint: (point: RoutePoint, newDistanceKm: number) => void;
  updateHeartRate: (bpm: number | null) => void;
  updateDuration: (seconds: number) => void;
  updatePace: (secondsPerKm: number) => void;
  updateCalories: (calories: number) => void;
  resetRun: () => void;
}

const initialState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pauseTime: null,
  pausedDuration: 0,
  distanceKm: 0,
  routePoints: [],
  heartRate: null,
  virtualRoomId: null,
  durationSeconds: 0,
  paceSecondsPerKm: 0,
  calories: 0,
};

export const useRunStore = create<RunStore>((set, get) => ({
  ...initialState,

  startRun: (virtualRoomId) => {
    set({
      isRunning: true,
      isPaused: false,
      startTime: Date.now(),
      pauseTime: null,
      pausedDuration: 0,
      distanceKm: 0,
      routePoints: [],
      heartRate: null,
      virtualRoomId: virtualRoomId ?? null,
      durationSeconds: 0,
      paceSecondsPerKm: 0,
      calories: 0,
    });
  },

  pauseRun: () => {
    set({ isPaused: true, pauseTime: Date.now() });
  },

  resumeRun: () => {
    const { pauseTime, pausedDuration } = get();
    const additionalPause = pauseTime ? (Date.now() - pauseTime) / 1000 : 0;
    set({
      isPaused: false,
      pauseTime: null,
      pausedDuration: pausedDuration + additionalPause,
    });
  },

  addRoutePoint: (point, newDistanceKm) => {
    set((state) => ({
      routePoints: [...state.routePoints, point],
      distanceKm: newDistanceKm,
    }));
  },

  updateHeartRate: (bpm) => set({ heartRate: bpm }),
  updateDuration: (seconds) => set({ durationSeconds: seconds }),
  updatePace: (secondsPerKm) => set({ paceSecondsPerKm: secondsPerKm }),
  updateCalories: (calories) => set({ calories }),

  resetRun: () => set(initialState),
}));
