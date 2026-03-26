import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONT_WEIGHT } from '../../constants/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  focused: boolean;
  name: IconName;
  outlineName: IconName;
  label: string;
}

function TabIcon({ focused, name, outlineName, label }: TabIconProps) {
  return (
    <View style={styles.tabItem}>
      {focused && <View style={styles.indicator} />}
      <Ionicons
        name={focused ? name : outlineName}
        size={23}
        color={focused ? COLORS.primary : COLORS.textMuted}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={95}
            tint="dark"
            style={[StyleSheet.absoluteFillObject, styles.tabBarBg]}
          />
        ),
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="radio-button-on" outlineName="radio-button-off" label="Record" />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="flame" outlineName="flame-outline" label="Feed" />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="people" outlineName="people-outline" label="Social" />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="trophy" outlineName="trophy-outline" label="Rank" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="person-circle" outlineName="person-circle-outline" label="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBg: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(5,5,14,0.88)',
  },
  tabItem: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 10,
    width: 54,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});
