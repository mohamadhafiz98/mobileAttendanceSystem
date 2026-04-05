import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { addAttendanceRecord, getAttendanceRecords } from '../storage/attendanceStorage';
import { AttendanceRecord, NewAttendanceRecordInput } from '../types/attendance';

type AttendanceContextValue = {
  records: AttendanceRecord[];
  isLoading: boolean;
  refreshRecords: () => Promise<void>;
  addRecord: (input: NewAttendanceRecordInput) => Promise<void>;
};

const AttendanceContext = createContext<AttendanceContextValue | undefined>(undefined);

export const AttendanceProvider = ({ children }: PropsWithChildren) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRecords = useCallback(async () => {
    const stored = await getAttendanceRecords();
    setRecords(stored);
  }, []);

  const addRecord = useCallback(async (input: NewAttendanceRecordInput) => {
    await addAttendanceRecord(input);
    await refreshRecords();
  }, [refreshRecords]);

  useEffect(() => {
    const load = async () => {
      await refreshRecords();
      setIsLoading(false);
    };

    void load();
  }, [refreshRecords]);

  const value = useMemo(
    () => ({ records, isLoading, refreshRecords, addRecord }),
    [records, isLoading, refreshRecords, addRecord],
  );

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
};

export const useAttendance = () => {
  const context = useContext(AttendanceContext);
  if (!context) {
    throw new Error('useAttendance must be used within AttendanceProvider');
  }
  return context;
};
