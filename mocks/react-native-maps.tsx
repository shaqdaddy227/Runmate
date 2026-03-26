import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Placeholder MapView for Expo Go compatibility.
// react-native-maps requires a native dev build (EAS build or local Xcode build).
// All other app features (auth, feed, friends, leaderboard, profile) work in Expo Go.

interface MapViewProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  [key: string]: any;
}

const MapView = ({ style, children }: MapViewProps) => (
  <View style={[styles.container, style]}>
    <LinearGradient
      colors={['#0a0a14', '#0d1a0d', '#0a0a14']}
      style={StyleSheet.absoluteFillObject}
    />
    {/* Decorative grid lines */}
    <View style={styles.grid}>
      {[...Array(6)].map((_, i) => (
        <View key={i} style={styles.gridRow} />
      ))}
    </View>
    <View style={styles.content}>
      <View style={styles.iconCircle}>
        <Ionicons name="map-outline" size={36} color="#00F5A0" />
      </View>
      <Text style={styles.title}>Live GPS Map</Text>
      <Text style={styles.subtitle}>
        Requires a development build.{'\n'}All other features work here in Expo Go.
      </Text>
      <View style={styles.badge}>
        <Ionicons name="information-circle-outline" size={12} color="#555577" />
        <Text style={styles.badgeText}>GPS tracking still runs in background</Text>
      </View>
    </View>
    {children}
  </View>
);

// No-op components
export const Marker = ({ children }: any) => <>{children}</> ;
export const Polyline = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
export default MapView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0a14',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-around',
    opacity: 0.15,
  },
  gridRow: {
    height: 1,
    backgroundColor: '#00F5A0',
  },
  content: {
    alignItems: 'center',
    gap: 10,
    padding: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0,245,160,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,245,160,0.06)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 11,
    color: '#555577',
  },
});
