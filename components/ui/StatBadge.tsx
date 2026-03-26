import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT_SIZE, FONT_WEIGHT, RADIUS } from '../../constants/theme';

interface StatBadgeProps {
  value: string;
  label: string;
  color?: string;
  style?: ViewStyle;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatBadge({
  value,
  label,
  color = COLORS.primary,
  style,
  size = 'md',
}: StatBadgeProps) {
  const fontSize = size === 'sm' ? FONT_SIZE.lg : size === 'lg' ? FONT_SIZE.h2 : FONT_SIZE.xxl;
  const labelSize = size === 'sm' ? FONT_SIZE.xs : FONT_SIZE.sm;

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.value, { color, fontSize }]}>{value}</Text>
      <Text style={[styles.label, { fontSize: labelSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
  },
  value: {
    fontWeight: FONT_WEIGHT.extrabold,
    letterSpacing: -0.5,
  },
  label: {
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
