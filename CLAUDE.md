# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npm start

# Run on Android (requires emulator or device)
npm run android

# Run on iOS (macOS only)
npm run ios

# Run in browser
npm run web
```

There is no lint or test command configured.

## Architecture

This is an **Expo (managed workflow) + React Native + TypeScript** attendance tracking app. It targets Android primarily (portrait-only).

### Auth Gate

`App.tsx` bootstraps by reading `sessionStorage` for `isLoggedIn`. If false, it renders `LoginScreen`; if true, it renders `AppNavigator`. Login is mock-only — hardcoded credentials in `src/constants/auth.ts` (`worker` / `123456`).

### Navigation

`src/navigation/AppNavigator.tsx` uses a `createBottomTabNavigator` with three tabs: Home, History, Statistics.

### Global State

`src/context/AttendanceContext.tsx` is the single source of truth for all attendance records. It exposes:
- `records` — full array loaded from AsyncStorage
- `addRecord(record)` — persists to storage then refreshes
- `refreshRecords()` — re-reads storage into state

All screens consume this via `useAttendance()`. Do not read storage directly from screens.

### Storage Layer

Two modules in `src/storage/`:
- `attendanceStorage.ts` — reads/writes the `@attendance/records` AsyncStorage key. Enforces **one CLOCK_IN and one CLOCK_OUT per calendar day** (upsert, not append).
- `sessionStorage.ts` — manages `@attendance/session` (login flag) and `@attendance/login_credentials` (optional remember-me).

Photos are copied into `FileSystem.documentDirectory` as `attendance-{timestamp}.{ext}` and optionally saved to the device Media Library.

### Key Types

`src/types/attendance.ts` defines `AttendanceRecord`:
```ts
{
  id: string;                        // Date.now() + random suffix
  type: 'CLOCK_IN' | 'CLOCK_OUT';
  timestampISO: string;
  localDate: string;                 // 'YYYY-MM-DD'
  localTime: string;                 // 12-hour 'HH:MM:SS AM/PM'
  latitude: number;
  longitude: number;
  locationAccuracyMeters: number | null;
  photoUri: string;                  // local file path
  mediaAssetId: string | null;
  createdAtISO: string;
}
```

### Clock In/Out Flow

1. User taps Clock In or Clock Out on `HomeScreen`
2. App requests Camera + Location + Media Library permissions
3. `AttendanceCameraModal` opens (`src/components/AttendanceCameraModal.tsx`)
4. On capture: photo saved to file system, GPS captured, record built
5. `addRecord()` called on the context → storage upsert → state refresh → all screens re-render

### Date/Time Utilities

All date/time formatting and calculation lives in `src/utils/dateTime.ts`. Use these helpers rather than formatting inline:
- `formatTime12Hour`, `formatDateLong`, `formatDateFromISO`
- `getWeekDates(date)` → Mon–Sun array of `'YYYY-MM-DD'` strings
- `calcHoursBetween(clockIn, clockOut)` → decimal hours or `null`
- `formatHoursDuration(hours)` → `"8h 30m"`

### Storage Keys

Defined as constants in `src/constants/storage.ts`:
- `ATTENDANCE_RECORDS = '@attendance/records'`
- `SESSION = '@attendance/session'`
- `LOGIN_CREDENTIALS = '@attendance/login_credentials'`
