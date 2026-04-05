import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';
import MapView, { Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendanceCameraModal } from '../components/AttendanceCameraModal';
import { useAttendance } from '../context/AttendanceContext';
import { AttendanceType } from '../types/attendance';
import { formatDateLong, formatTime12Hour, formatTimeFromISO } from '../utils/dateTime';

type HomeScreenProps = {
  onLogout: () => Promise<void> | void;
};

const DEFAULT_REGION: Region = {
  latitude: 3.139,
  longitude: 101.6869,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const getTodayKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const HomeScreen = ({ onLogout }: HomeScreenProps) => {
  const { records, addRecord } = useAttendance();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [activeType, setActiveType] = useState<AttendanceType | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = useMemo(() => getTodayKey(now), [now]);

  const todaysRecords = useMemo(
    () => records.filter((record) => record.localDate === todayKey),
    [records, todayKey],
  );

  const latestClockIn = useMemo(() => {
    const entry = todaysRecords.find((record) => record.type === 'CLOCK_IN');
    return entry ? formatTimeFromISO(entry.timestampISO) : '--:--:--';
  }, [todaysRecords]);

  const latestClockOut = useMemo(() => {
    const entry = todaysRecords.find((record) => record.type === 'CLOCK_OUT');
    return entry ? formatTimeFromISO(entry.timestampISO) : '--:--:--';
  }, [todaysRecords]);

  const requestPermissions = async () => {
    let cameraGranted = false;
    let locationGranted = false;
    let mediaGranted = false;

    try {
      const camera = await Camera.requestCameraPermissionsAsync();
      cameraGranted = camera.granted;
    } catch {
      cameraGranted = false;
    }

    try {
      const location = await Location.requestForegroundPermissionsAsync();
      locationGranted = location.granted;
    } catch {
      locationGranted = false;
    }

    // Media library permission is optional because we also keep a persistent
    // app-local copy for history preview.
    try {
      const media = await MediaLibrary.requestPermissionsAsync();
      mediaGranted = media.granted;
    } catch {
      mediaGranted = false;
    }

    return {
      cameraGranted,
      locationGranted,
      mediaGranted,
    };
  };

  const openCameraForType = (type: AttendanceType) => {
    setActiveType(type);
    setCameraVisible(true);
  };

  const handleClockPress = async (type: AttendanceType) => {
    const granted = await requestPermissions();
    if (!granted.cameraGranted || !granted.locationGranted) {
      Alert.alert('Permission required', 'Please allow camera and location permissions.');
      return;
    }

    const hasSameTypeToday = todaysRecords.some((record) => record.type === type);
    if (hasSameTypeToday) {
      const typeText = type === 'CLOCK_IN' ? 'Clock In' : 'Clock Out';
      Alert.alert(
        `${typeText} already recorded`,
        `You already have a ${typeText} today. Do you want to replace it with a new one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'default',
            onPress: () => openCameraForType(type),
          },
        ],
      );
      return;
    }

    openCameraForType(type);
  };

  const handleCapture = async (photoUri: string) => {
    if (!activeType) return;

    let didSave = false;

    try {
      const nowISO = new Date().toISOString();
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setRegion((prev) => ({
        ...prev,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      }));

      const extension = photoUri.split('.').pop() ?? 'jpg';
      const persistentPhotoUri = `${FileSystem.documentDirectory}attendance-${Date.now()}.${extension}`;
      await FileSystem.copyAsync({
        from: photoUri,
        to: persistentPhotoUri,
      });

      let mediaAssetId: string | null = null;
      try {
        const asset = await MediaLibrary.createAssetAsync(persistentPhotoUri);
        mediaAssetId = asset.id;
      } catch {
        mediaAssetId = null;
      }

      await addRecord({
        type: activeType,
        timestampISO: nowISO,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        locationAccuracyMeters: currentLocation.coords.accuracy ?? null,
        photoUri: persistentPhotoUri,
        mediaAssetId,
      });

      didSave = true;
      Alert.alert('Saved', `${activeType === 'CLOCK_IN' ? 'Clock In' : 'Clock Out'} recorded successfully.`);
    } catch {
      Alert.alert('Save failed', 'Could not save attendance record. Please try again.');
    } finally {
      if (didSave) {
        setCameraVisible(false);
        setActiveType(null);
      }
    }
  };

  const handleLogoutPress = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          void onLogout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Today</Text>
            <Text style={styles.dateTimeText}>{formatDateLong(now)}</Text>
            <Text style={styles.dateTimeText}>{formatTime12Hour(now)}</Text>
          </View>

          <Pressable style={styles.secondaryButton} onPress={handleLogoutPress}>
            <Text style={styles.secondaryButtonText}>Logout</Text>
          </Pressable>
        </View>

        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={() => handleClockPress('CLOCK_IN')}>
            <Text style={styles.primaryText}>Clock In</Text>
          </Pressable>
          <Pressable style={styles.primaryButton} onPress={() => handleClockPress('CLOCK_OUT')}>
            <Text style={styles.primaryText}>Clock Out</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live Location</Text>
          <MapView
            style={styles.map}
            region={region}
            onUserLocationChange={(event) => {
              const coords = event.nativeEvent.coordinate;
              if (!coords) return;

              setRegion((prev) => ({
                ...prev,
                latitude: coords.latitude,
                longitude: coords.longitude,
              }));
            }}
            showsUserLocation
            followsUserLocation
            showsMyLocationButton
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Clock In</Text>
            <Text style={styles.summaryValue}>{latestClockIn}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Clock Out</Text>
            <Text style={styles.summaryValue}>{latestClockOut}</Text>
          </View>
        </View>

        <AttendanceCameraModal
          visible={cameraVisible}
          onClose={() => {
            setCameraVisible(false);
            setActiveType(null);
          }}
          onCapture={handleCapture}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  dateTimeText: {
    marginTop: 4,
    color: '#666666',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    height: 50,
    borderRadius: 999,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#222222',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 14,
  },
  cardTitle: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: 260,
    borderRadius: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    color: '#555555',
    fontSize: 15,
  },
  summaryValue: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DADADA',
  },
});
