import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DayData {
  distance_km: number;
}

interface WeeklyChartProps {
  data: DayData[]; // 7 items, Mon-Sun
  goalKm?: number;
}

export default function WeeklyChart({ data, goalKm = 5 }: WeeklyChartProps) {
  const maxVal = Math.max(...data.map((d) => d.distance_km), goalKm, 1);
  const today = new Date().getDay(); // 0=Sun, 1=Mon...
  const todayIndex = today === 0 ? 6 : today - 1; // Convert to Mon=0 index

  const totalWeekKm = data.reduce((sum, d) => sum + d.distance_km, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.total}>{totalWeekKm.toFixed(1)} km</Text>
      </View>

      {/* Goal line */}
      <View style={styles.barsWrapper}>
        <View
          style={[
            styles.goalLine,
            { bottom: `${(goalKm / maxVal) * 100}%` },
          ]}
        >
          <Text style={styles.goalLabel}>{goalKm} km goal</Text>
        </View>

        {data.map((day, i) => {
          const heightPercent = maxVal > 0 ? (day.distance_km / maxVal) * 100 : 0;
          const isToday = i === todayIndex;
          const isCompleted = day.distance_km > 0;

          return (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barTrack}>
                {isCompleted ? (
                  <LinearGradient
                    colors={isToday ? [COLORS.secondary, COLORS.primary] : [COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[styles.bar, { height: `${Math.max(heightPercent, 4)}%` }]}
                  />
                ) : (
                  <View style={[styles.bar, styles.emptyBar, { height: '4%' }]} />
                )}
              </View>
              <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                {DAYS[i]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: COLORS.text,
  },
  total: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.primary,
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 6,
    position: 'relative',
  },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.3)',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  goalLabel: {
    position: 'absolute',
    right: 0,
    top: -14,
    fontSize: FONT_SIZE.xs,
    color: COLORS.warning,
    fontWeight: FONT_WEIGHT.medium,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: RADIUS.xs,
    minHeight: 4,
  },
  emptyBar: {
    backgroundColor: COLORS.border,
  },
  dayLabel: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  dayLabelToday: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});
