/**
 * Haversine formula: distance between two GPS coordinates in kilometers.
 */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Format duration in seconds to MM:SS or H:MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format pace (seconds per km) to MM:SS/km string
 */
export function formatPace(secondsPerKm: number | null): string {
  if (!secondsPerKm || !isFinite(secondsPerKm) || secondsPerKm <= 0) return '--:--';
  const m = Math.floor(secondsPerKm / 60);
  const s = Math.floor(secondsPerKm % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Format distance in km with appropriate decimal places
 */
export function formatDistance(km: number): string {
  if (km < 1) return (km * 1000).toFixed(0) + 'm';
  return km.toFixed(2);
}

/**
 * Format distance with unit label
 */
export function formatDistanceWithUnit(km: number): string {
  if (km < 1) return `${(km * 1000).toFixed(0)} m`;
  return `${km.toFixed(2)} km`;
}

/**
 * Calculate calories burned (rough estimate: ~60 cal/km for average person)
 */
export function estimateCalories(distanceKm: number, weightKg = 70): number {
  return Math.round(distanceKm * weightKg * 1.036);
}

/**
 * Calculate average pace from distance and duration
 */
export function calculatePace(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0) return 0;
  return durationSeconds / distanceKm;
}

/**
 * Format a date as relative time (e.g. "2 hours ago")
 */
export function timeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format a full date string to readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get the start of the current week (Monday)
 */
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

/**
 * Generate a human-readable run title based on time of day
 */
export function generateRunTitle(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 9) return 'Morning Run';
  if (hour >= 9 && hour < 12) return 'Late Morning Run';
  if (hour >= 12 && hour < 14) return 'Lunch Run';
  if (hour >= 14 && hour < 17) return 'Afternoon Run';
  if (hour >= 17 && hour < 20) return 'Evening Run';
  return 'Night Run';
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface AchievementMeta {
  label: string;
  description: string;
  icon: string;
  iconColor: string;
  gradientStart: string;
  gradientEnd: string;
}

/**
 * Get achievement metadata — uses Ionicons, no emojis.
 */
export function getAchievementMeta(type: string): AchievementMeta {
  const map: Record<string, AchievementMeta> = {
    first_run: {
      label: 'First Step', description: 'Completed your first run',
      icon: 'footsteps-outline', iconColor: '#00F5A0',
      gradientStart: 'rgba(0,245,160,0.15)', gradientEnd: 'rgba(0,245,160,0.05)',
    },
    run_5k: {
      label: '5K Club', description: 'Ran 5 kilometers in one session',
      icon: 'flash-outline', iconColor: '#00C9FF',
      gradientStart: 'rgba(0,201,255,0.15)', gradientEnd: 'rgba(0,201,255,0.05)',
    },
    run_10k: {
      label: '10K Strong', description: 'Ran 10 kilometers in one session',
      icon: 'trending-up-outline', iconColor: '#8B5CF6',
      gradientStart: 'rgba(139,92,246,0.2)', gradientEnd: 'rgba(139,92,246,0.05)',
    },
    run_half_marathon: {
      label: 'Half Warrior', description: 'Completed a half marathon',
      icon: 'medal-outline', iconColor: '#FFD700',
      gradientStart: 'rgba(255,215,0,0.15)', gradientEnd: 'rgba(255,215,0,0.05)',
    },
    run_marathon: {
      label: 'Marathon', description: 'Completed a full marathon',
      icon: 'trophy-outline', iconColor: '#FF8C00',
      gradientStart: 'rgba(255,140,0,0.2)', gradientEnd: 'rgba(255,140,0,0.05)',
    },
    streak_7: {
      label: '7-Day Streak', description: 'Ran 7 days in a row',
      icon: 'flame-outline', iconColor: '#FF4B5C',
      gradientStart: 'rgba(255,75,92,0.15)', gradientEnd: 'rgba(255,75,92,0.05)',
    },
    streak_30: {
      label: '30-Day Streak', description: 'Ran 30 days in a row',
      icon: 'flame', iconColor: '#FF4B5C',
      gradientStart: 'rgba(255,75,92,0.25)', gradientEnd: 'rgba(255,75,92,0.08)',
    },
    total_100k: {
      label: '100K Total', description: 'Ran 100km lifetime total',
      icon: 'earth-outline', iconColor: '#00C9FF',
      gradientStart: 'rgba(0,201,255,0.15)', gradientEnd: 'rgba(0,201,255,0.05)',
    },
    total_500k: {
      label: '500K Legend', description: 'Ran 500km lifetime total',
      icon: 'rocket-outline', iconColor: '#8B5CF6',
      gradientStart: 'rgba(139,92,246,0.25)', gradientEnd: 'rgba(139,92,246,0.08)',
    },
    virtual_run: {
      label: 'Social Runner', description: 'Completed a virtual run with friends',
      icon: 'people-outline', iconColor: '#00F5A0',
      gradientStart: 'rgba(0,245,160,0.15)', gradientEnd: 'rgba(0,245,160,0.05)',
    },
    early_bird: {
      label: 'Early Bird', description: 'Completed a run before 7am',
      icon: 'sunny-outline', iconColor: '#FFD700',
      gradientStart: 'rgba(255,215,0,0.15)', gradientEnd: 'rgba(255,215,0,0.05)',
    },
    night_runner: {
      label: 'Night Owl', description: 'Completed a run after 10pm',
      icon: 'moon-outline', iconColor: '#8B5CF6',
      gradientStart: 'rgba(139,92,246,0.15)', gradientEnd: 'rgba(139,92,246,0.05)',
    },
  };
  return map[type] ?? {
    label: type, description: 'Special achievement',
    icon: 'ribbon-outline', iconColor: '#00F5A0',
    gradientStart: 'rgba(0,245,160,0.15)', gradientEnd: 'rgba(0,245,160,0.05)',
  };
}
