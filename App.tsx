import 'react-native-gesture-handler';

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AttendanceProvider } from './src/context/AttendanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LoginScreen } from './src/screens/LoginScreen';
import { getSession, setLoggedIn } from './src/storage/sessionStorage';

export default function App() {
  const [isBooting, setIsBooting] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const session = await getSession();
      setIsAuthenticated(session.isLoggedIn);
      setIsBooting(false);
    };

    void bootstrap();
  }, []);

  const handleLoginSuccess = async () => {
    await setLoggedIn(true);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await setLoggedIn(false);
    setIsAuthenticated(false);
  };

  if (isBooting) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#111111" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AttendanceProvider>
        <AppNavigator onLogout={handleLogout} />
      </AttendanceProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
