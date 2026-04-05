import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import MapView, { Marker } from 'react-native-maps';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAttendance } from '../context/AttendanceContext';
import { AttendanceRecord } from '../types/attendance';
import { formatDateFromISO, formatTimeFromISO } from '../utils/dateTime';

export const HistoryScreen = () => {
  const { records } = useAttendance();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  const exportToCSV = async () => {
    if (records.length === 0) {
      Alert.alert('No records', 'There are no attendance records to export.');
      return;
    }

    try {
      const headers = ['Type', 'Date', 'Time', 'Latitude', 'Longitude', 'Accuracy'];
      const rows = records.map(record => [
        record.type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out',
        formatDateFromISO(record.timestampISO),
        formatTimeFromISO(record.timestampISO),
        record.latitude.toString(),
        record.longitude.toString(),
        record.locationAccuracyMeters !== null ? record.locationAccuracyMeters.toString() : '',
      ]);
      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const fileName = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;

      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) return;

      const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'text/csv'
      );
      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Exported', `Saved as ${fileName}`);
    } catch (error) {
      console.error('Export failed:', error);
      const message = error instanceof Error && error.message.includes('writable')
        ? "That folder isn't writable. Please navigate to a real folder (e.g. Internal Storage > Download) instead of using the Downloads shortcut."
        : 'An error occurred while exporting the attendance records.';
      Alert.alert('Export Failed', message);
    }
  };

  const openRecord = async (record: AttendanceRecord) => {
    let resolvedUri = record.photoUri;

    if (record.mediaAssetId) {
      try {
        const info = await MediaLibrary.getAssetInfoAsync(record.mediaAssetId);
        resolvedUri = info.localUri ?? info.uri ?? resolvedUri;
      } catch {
        resolvedUri = record.photoUri;
      }
    }

    setImageLoading(true);
    setSelectedRecord(record);
    setSelectedImageUri(resolvedUri);
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const isClockIn = item.type === 'CLOCK_IN';
    return (
      <Pressable style={styles.row} onPress={() => void openRecord(item)}>
        <Image source={{ uri: item.photoUri }} style={styles.thumb} />

        <View style={styles.rowContent}>
          <View style={styles.rowTitleRow}>
            <View style={[styles.typeBadge, isClockIn ? styles.typeBadgeIn : styles.typeBadgeOut]}>
              <Text style={styles.typeBadgeText}>{isClockIn ? 'Clock In' : 'Clock Out'}</Text>
            </View>
          </View>
          <Text style={styles.rowSubtitle}>{formatDateFromISO(item.timestampISO)}</Text>
          <Text style={styles.rowSubtitle}>
            {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
          </Text>
        </View>

        <Text style={styles.time}>{formatTimeFromISO(item.timestampISO)}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Attendance History</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          </View>
        }
      />

      <Pressable style={styles.exportButton} onPress={() => void exportToCSV()}>
        <Text style={styles.exportButtonText}>Export CSV</Text>
      </Pressable>

      <Modal visible={Boolean(selectedRecord)} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalTitle}>Attendance Photo</Text>

            <View style={styles.modalImageWrap}>
              <Image
                source={{ uri: selectedImageUri }}
                style={styles.modalImage}
                resizeMode="cover"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
              />
              {imageLoading ? (
                <View style={styles.imageLoader}>
                  <ActivityIndicator color="#111111" />
                </View>
              ) : null}
            </View>

            {selectedRecord ? (
              <View style={styles.metaCard}>
                <View style={styles.metaTypeRow}>
                  <View style={[
                    styles.typeBadge,
                    selectedRecord.type === 'CLOCK_IN' ? styles.typeBadgeIn : styles.typeBadgeOut,
                  ]}>
                    <Text style={styles.typeBadgeText}>
                      {selectedRecord.type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.metaText}>Date: {formatDateFromISO(selectedRecord.timestampISO)}</Text>
                <Text style={styles.metaText}>Time: {formatTimeFromISO(selectedRecord.timestampISO)}</Text>
                <Text style={styles.metaText}>
                  GPS: {selectedRecord.latitude.toFixed(6)}, {selectedRecord.longitude.toFixed(6)}
                </Text>

                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    region={{
                      latitude: selectedRecord.latitude,
                      longitude: selectedRecord.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    showsUserLocation={false}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: selectedRecord.latitude,
                        longitude: selectedRecord.longitude,
                      }}
                      title="Attendance Location"
                    />
                  </MapView>
                </View>
              </View>
            ) : null}

            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setSelectedRecord(null);
                setSelectedImageUri('');
                setImageLoading(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    color: '#111111',
    fontWeight: '700',
  },
  exportButton: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    backgroundColor: '#111111',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 10,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  rowContent: {
    flex: 1,
    marginHorizontal: 12,
    gap: 3,
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeIn: {
    backgroundColor: '#E6F4EA',
  },
  typeBadgeOut: {
    backgroundColor: '#FDE8E8',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111111',
  },
  rowSubtitle: {
    color: '#666666',
    fontSize: 12,
  },
  time: {
    color: '#111111',
    fontWeight: '600',
    fontSize: 13,
  },
  divider: {
    borderBottomColor: '#E3E3E3',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginTop: 12,
    marginBottom: 12,
  },
  modalImageWrap: {
    width: '100%',
    height: 360,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  imageLoader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  metaCard: {
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  metaTypeRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  metaText: {
    color: '#222222',
    fontSize: 14,
  },
  mapContainer: {
    marginTop: 8,
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  closeButton: {
    marginTop: 16,
    height: 48,
    borderRadius: 999,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
