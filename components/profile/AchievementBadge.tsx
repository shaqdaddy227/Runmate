import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT } from '../../constants/theme';
import { getAchievementMeta } from '../../lib/utils';
import { Achievement } from '../../types';

interface AchievementBadgeProps {
  achievement: Achievement;
  locked?: boolean;
  style?: ViewStyle;
}

export default function AchievementBadge({ achievement, locked, style }: AchievementBadgeProps) {
  const meta = getAchievementMeta(achievement.type);

  if (locked) {
    return (
      <View style={[styles.container, style]}>
        <View style={[styles.gradient, styles.lockedGradient]}>
          <Ionicons name="lock-closed" size={22} color={COLORS.textMuted} />
        </View>
        <Text style={[styles.label, styles.lockedText]} numberOfLines={1}>
          {meta.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[meta.gradientStart, meta.gradientEnd]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name={meta.icon as any} size={24} color={meta.iconColor} />
      </LinearGradient>
      <Text style={styles.label} numberOfLines={1}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  gradient: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  lockedGradient: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textSecondary,
    fontWeight: FONT_WEIGHT.medium,
    textAlign: 'center',
  },
  lockedText: {
    color: COLORS.textMuted,
  },
});
