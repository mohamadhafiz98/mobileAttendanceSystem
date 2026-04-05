import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';

type AttendanceCameraModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoUri: string) => Promise<void>;
};

export const AttendanceCameraModal = ({
  visible,
  onClose,
  onCapture,
}: AttendanceCameraModalProps) => {
  const cameraRef = useRef<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsCapturing(false);
      setIsSubmitting(false);
      setCapturedUri(null);
    }
  }, [visible]);

  const handleTakePhoto = async () => {
    if (isCapturing || isSubmitting) return;
    setIsCapturing(true);

    try {
      const pictureWithCurrentApi = await cameraRef.current?.takePicture?.({ quality: 0.8 });
      const pictureWithLegacyApi = pictureWithCurrentApi
        ? null
        : await cameraRef.current?.takePictureAsync?.({ quality: 0.8 });
      const photo = pictureWithCurrentApi ?? pictureWithLegacyApi;

      if (!photo?.uri) {
        Alert.alert('Capture failed', 'Could not capture photo. Please try again.');
        return;
      }

      setCapturedUri(photo.uri);
    } catch {
      Alert.alert('Capture failed', 'Could not capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirmPhoto = async () => {
    if (!capturedUri || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await onCapture(capturedUri);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>{capturedUri ? 'Confirm Photo' : 'Capture Location Photo'}</Text>

        {capturedUri ? (
          <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />
        ) : (
          <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        )}

        <View style={styles.actionsRow}>
          <Pressable
            style={styles.secondaryButton}
            onPress={capturedUri ? () => setCapturedUri(null) : onClose}
            disabled={isCapturing || isSubmitting}
          >
            <Text style={styles.secondaryText}>{capturedUri ? 'Retake' : 'Cancel'}</Text>
          </Pressable>

          {capturedUri ? (
            <Pressable
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleConfirmPhoto}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryText}>{isSubmitting ? 'Saving...' : 'Use Photo'}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.primaryButton, isCapturing && styles.buttonDisabled]}
              onPress={handleTakePhoto}
              disabled={isCapturing}
            >
              <Text style={styles.primaryText}>{isCapturing ? 'Capturing...' : 'Capture'}</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
  },
  camera: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
  },
  previewImage: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryText: {
    color: '#222222',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
