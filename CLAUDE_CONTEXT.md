# Runmate App — Claude Context Handoff

## What This Project Is
**Runmate** is a social running app built with **React Native + Expo (SDK 54)**. It is styled like Strava/Nike Run Club with a dark UI theme. Backend is **Supabase** (Postgres + Auth + Realtime).

## Tech Stack
- **Framework**: React Native / Expo SDK 54
- **Router**: expo-router (file-based routing)
- **Backend**: Supabase (auth, database, realtime)
- **State**: Zustand (`store/authStore.ts`, `store/runStore.ts`)
- **Data fetching**: TanStack React Query
- **Animations**: react-native-reanimated v4
- **Maps**: react-native-maps (mocked in Expo Go — see below)
- **Health**: react-native-health (HealthKit, mocked in Expo Go)
- **Icons**: @expo/vector-icons (Ionicons)

## Repository
- **GitHub**: `shaqdaddy227/Runmate`
- **Active branch**: `claude/create-new-app-TDKgM`

## Project Structure
```
Runmate/
├── app/
│   ├── _layout.tsx           # Root layout, auth guard
│   ├── index.tsx             # Entry redirect
│   ├── active-run.tsx        # Live run screen (map + stats)
│   ├── run/[id].tsx          # Run detail screen
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (tabs)/
│       ├── index.tsx         # Home dashboard
│       ├── feed.tsx          # Social feed
│       ├── friends.tsx       # Follow/discover/virtual rooms
│       ├── leaderboard.tsx   # Weekly/monthly/all-time rankings
│       └── profile.tsx       # User profile + run history
├── hooks/
│   ├── useAuth.ts            # Auth state + profile loading
│   ├── useRun.ts             # Run tracking logic
│   └── useLocation.ts        # GPS location subscription
├── lib/
│   ├── supabase.ts           # Supabase client + all DB helpers
│   ├── utils.ts              # Formatting helpers
│   └── health.ts             # HealthKit integration
├── store/
│   ├── authStore.ts          # Zustand auth store
│   └── runStore.ts           # Zustand run state
├── components/
│   ├── ui/                   # Button, Input, Card, Avatar, StatBadge
│   ├── feed/ActivityCard.tsx
│   └── profile/WeeklyChart, AchievementBadge
├── constants/theme.ts        # Colors, fonts, spacing, dark map style
├── types/index.ts            # TypeScript types
├── mocks/
│   ├── react-native-maps.tsx # Placeholder shown in Expo Go
│   └── react-native-health.ts
├── supabase/schema.sql       # Full DB schema (run this in Supabase SQL editor)
└── eas.json                  # EAS Build config
```

## Supabase Setup
- **Project URL**: `https://gufgrpjrzliehqhgiehj.supabase.co`
- **Anon key**: stored in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- **Schema**: Already applied — run `supabase/schema.sql` in the Supabase SQL Editor to set up all tables

### Tables
- `profiles` — user data (linked to auth.users)
- `runs` — run history with route JSON
- `likes` / `comments` — social interactions
- `friendships` — follow system
- `virtual_rooms` / `live_locations` — live group run feature
- `achievements` — badges earned by users

### RPC Functions in schema
- `get_leaderboard(p_period, p_limit)` — returns ranked users
- `increment_profile_stats(p_user_id, p_distance_km, p_duration_seconds)` — updates totals after a run

## What Has Been Completed
1. Full app built from scratch (auth, feed, friends, leaderboard, profile, active run)
2. Strava/Nike-grade dark UI redesign
3. Expo SDK 54 compatibility fixes
4. All emojis replaced with Ionicons
5. Idempotent schema SQL (`CREATE TABLE IF NOT EXISTS`)
6. Placeholder assets added
7. **Critical bug fixes** (latest commit `3b9b536`):
   - `fetchProfile` now uses `.maybeSingle()` instead of `.single()` — fixes PGRST116 crash
   - Signup properly handles profile creation failure, shows user-facing errors
   - Profile loaded into store immediately after signup (no race condition)
   - Virtual room `roomId` passed to `active-run` screen
   - Join button in virtual rooms tab is now functional
   - Auto-start in `active-run` guarded with ref (no double-start)
   - Location tracking stops on pause, restarts on resume
   - Live broadcast skips ticks while paused
   - Profile stats refresh in store after run is saved
8. `eas.json` added for EAS Build

## Current Issue — Map Not Showing in Expo Go
`react-native-maps` requires native code and **cannot run in Expo Go**. A mock placeholder is shown instead (`mocks/react-native-maps.tsx`). All other features work fine in Expo Go.

### Solution: Build a Development Client
We chose **Option B — run directly via Xcode (free, no Apple Developer account needed)**.

**Status**: Xcode is currently downloading from the Mac App Store.

### Steps to complete once Xcode is installed:
1. Install Xcode Command Line Tools (may auto-prompt, or run):
   ```bash
   xcode-select --install
   ```
2. Open Xcode once and accept the license agreement
3. Plug iPhone into Mac via USB
4. In the Runmate project folder:
   ```bash
   npx expo run:ios
   ```
5. Trust the developer certificate on the iPhone when prompted
6. The app will install and the live map will work

## Environment
- **Mac**: macOS version too old for latest Xcode (workaround in progress)
- **Phone**: iPhone (iOS)
- **Running app**: via `npx expo start` in the Runmate directory
- **Expo account**: shaqdaddy227

## Key Files to Know
- `lib/supabase.ts` — all Supabase queries, use `maybeSingle()` not `single()` for profile fetches
- `hooks/useAuth.ts` — auth state management, loads profile on session change
- `hooks/useRun.ts` — full run lifecycle (start/pause/resume/stop + GPS + health + live broadcast)
- `app/active-run.tsx` — the live run UI, reads `roomId` param for virtual runs
- `constants/theme.ts` — all colors and design tokens, do not hardcode colors elsewhere
- `supabase/schema.sql` — source of truth for DB schema

## What To Do Next (after map is working)
- Test full run flow: start → track → pause/resume → stop → save → view in profile
- Test signup/login flow with a real account
- Test virtual room creation and joining
- Test leaderboard, feed likes/comments, friend follow/unfollow
- Consider EAS production build for TestFlight distribution
