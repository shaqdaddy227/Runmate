// Mock for react-native-health in Expo Go.
// HealthKit and Apple Watch integration requires a native dev build.
const AppleHealthKit = {
  initHealthKit: (_perms, cb) => cb(null),
  getHeartRateSamples: (_opts, cb) => cb(null, []),
  saveWorkout: (_opts, cb) => cb(null),
  Constants: {
    Permissions: {
      HeartRate: 'HeartRate',
      ActiveEnergyBurned: 'ActiveEnergyBurned',
      StepCount: 'StepCount',
      DistanceWalkingRunning: 'DistanceWalkingRunning',
      Workout: 'Workout',
    },
  },
};

module.exports = { default: AppleHealthKit };
