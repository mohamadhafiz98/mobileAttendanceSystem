export type AttendanceType = 'CLOCK_IN' | 'CLOCK_OUT';

export type AttendanceRecord = {
  id: string;
  type: AttendanceType;
  timestampISO: string;
  localDate: string;
  localTime: string;
  latitude: number;
  longitude: number;
  locationAccuracyMeters: number | null;
  photoUri: string;
  mediaAssetId: string | null;
  createdAtISO: string;
};

export type NewAttendanceRecordInput = {
  type: AttendanceType;
  timestampISO: string;
  latitude: number;
  longitude: number;
  locationAccuracyMeters: number | null;
  photoUri: string;
  mediaAssetId: string | null;
};
