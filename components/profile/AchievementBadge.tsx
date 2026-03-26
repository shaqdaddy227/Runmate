import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View style={[styles.container, styles.locked, style]}>
        <Text style={[styles.emoji, styles.lockedEmoji]}>🔒</Text>
        <Text style={[styles.label, styles.lockedText]} numberOfLines={1}>
          {meta.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={['rgba(139,92,246,0.2)', 'rgba(0,201,255,0.1)']}
        style={styles.gradient}
      >
        <Text style={styles.emoji}>{meta.emoji}</Text>
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
    borderColor: 'rgba(139,92,246,0.4)',
  },
  locked: {},
  emoji: {
    fontSize: 26,
  },
  lockedEmoji: {
    opacity: 0.3,
    fontSize: 22,
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
