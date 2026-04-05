import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants/storage';
import { AttendanceRecord, NewAttendanceRecordInput } from '../types/attendance';
import { formatTimeFromISO } from '../utils/dateTime';

const toLocalDate = (iso: string) => {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTime = (iso: string) => formatTimeFromISO(iso);

export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.ATTENDANCE_RECORDS);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as AttendanceRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveAttendanceRecords = async (records: AttendanceRecord[]): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.ATTENDANCE_RECORDS, JSON.stringify(records));
};

export const addAttendanceRecord = async (
  input: NewAttendanceRecordInput,
): Promise<AttendanceRecord> => {
  const newRecord: AttendanceRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type: input.type,
    timestampISO: input.timestampISO,
    localDate: toLocalDate(input.timestampISO),
    localTime: toLocalTime(input.timestampISO),
    latitude: input.latitude,
    longitude: input.longitude,
    locationAccuracyMeters: input.locationAccuracyMeters,
    photoUri: input.photoUri,
    mediaAssetId: input.mediaAssetId,
    createdAtISO: new Date().toISOString(),
  };

  const current = await getAttendanceRecords();

  // Keep a single CLOCK_IN and CLOCK_OUT per day by replacing an existing same-day same-type entry.
  const withoutSameDayType = current.filter(
    (record) => !(record.localDate === newRecord.localDate && record.type === newRecord.type),
  );

  const updated = [newRecord, ...withoutSameDayType].sort(
    (a, b) => new Date(b.timestampISO).getTime() - new Date(a.timestampISO).getTime(),
  );
  await saveAttendanceRecords(updated);

  return newRecord;
};
