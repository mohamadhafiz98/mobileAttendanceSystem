import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAttendance } from '../context/AttendanceContext';
import {
  calcHoursBetween,
  formatHoursDuration,
  formatLocalDate,
  formatTimeFromISO,
  getWeekDates,
} from '../utils/dateTime';

type DailySession = {
  localDate: string;
  clockInISO: string | null;
  clockOutISO: string | null;
  hoursWorked: number | null;
  isInProgress: boolean;
};

export default function StatisticsScreen() {
  const { records } = useAttendance();

  const weekDates = useMemo(() => getWeekDates(new Date()), []);

  const sessions = useMemo<DailySession[]>(() => {
    return weekDates.map((localDate) => {
      const dayRecords = records.filter((r) => r.localDate === localDate);
      const clockIn = dayRecords.find((r) => r.type === 'CLOCK_IN') ?? null;
      const clockOut = dayRecords.find((r) => r.type === 'CLOCK_OUT') ?? null;
      const hoursWorked =
        clockIn && clockOut
          ? calcHoursBetween(clockIn.timestampISO, clockOut.timestampISO)
          : null;
      const isInProgress = clockIn !== null && clockOut === null;
      return {
        localDate,
        clockInISO: clockIn?.timestampISO ?? null,
        clockOutISO: clockOut?.timestampISO ?? null,
        hoursWorked,
        isInProgress,
      };
    });
  }, [records, weekDates]);

  const daysPresent = useMemo(
    () => sessions.filter((s) => s.clockInISO !== null).length,
    [sessions]
  );

  const totalHours = useMemo(
    () => sessions.reduce((sum, s) => sum + (s.hoursWorked ?? 0), 0),
    [sessions]
  );

  const renderSession = ({ item }: { item: DailySession }) => {
    const hasAnyRecord = item.clockInISO !== null || item.clockOutISO !== null;
    return (
      <View style={[styles.sessionCard, !hasAnyRecord && styles.sessionCardEmpty]}>
        <Text style={styles.sessionDate}>{formatLocalDate(item.localDate)}</Text>
        <View style={styles.sessionRow}>
          <View style={styles.sessionCol}>
            <Text style={styles.sessionLabel}>Clock In</Text>
            <Text style={[styles.sessionValue, !item.clockInISO && styles.sessionValueEmpty]}>
              {item.clockInISO ? formatTimeFromISO(item.clockInISO) : '—'}
            </Text>
          </View>
          <View style={styles.sessionCol}>
            <Text style={styles.sessionLabel}>Clock Out</Text>
            {item.isInProgress ? (
              <View style={styles.inProgressBadge}>
                <Text style={styles.inProgressText}>In Progress</Text>
              </View>
            ) : (
              <Text style={[styles.sessionValue, !item.clockOutISO && styles.sessionValueEmpty]}>
                {item.clockOutISO ? formatTimeFromISO(item.clockOutISO) : '—'}
              </Text>
            )}
          </View>
          <View style={styles.sessionCol}>
            <Text style={styles.sessionLabel}>Hours</Text>
            <Text style={[styles.sessionValue, !item.hoursWorked && styles.sessionValueEmpty]}>
              {item.hoursWorked !== null ? formatHoursDuration(item.hoursWorked) : '—'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Statistics</Text>
        <Text style={styles.subtitle}>This Week</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{daysPresent}</Text>
          <Text style={styles.summaryLabel}>Days Present</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {totalHours > 0 ? formatHoursDuration(totalHours) : '0h'}
          </Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.localDate}
        renderItem={renderSession}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records this week.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111111',
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  sessionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 16,
  },
  sessionCardEmpty: {
    opacity: 0.45,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 10,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionCol: {
    flex: 1,
    alignItems: 'center',
  },
  sessionLabel: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 4,
  },
  sessionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  sessionValueEmpty: {
    color: '#BBBBBB',
  },
  inProgressBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  inProgressText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 14,
    marginTop: 40,
  },
});
