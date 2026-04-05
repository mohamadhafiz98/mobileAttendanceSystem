import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MOCK_AUTH } from '../constants/auth';
import { getLoginCredentials, setLoginCredentials } from '../storage/sessionStorage';

type LoginScreenProps = {
  onLoginSuccess: () => void;
};

export const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasError, setHasError] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const credentials = await getLoginCredentials();
      if (credentials) {
        setUsername(credentials.username);
        setPassword(credentials.password);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  const canSubmit = useMemo(() => username.length > 0 && password.length > 0, [username, password]);

  const handleLogin = async () => {
    const valid = username === MOCK_AUTH.username && password === MOCK_AUTH.password;
    if (!valid) {
      setHasError(true);
      return;
    }

    setHasError(false);
    
    if (rememberMe) {
      await setLoginCredentials({ username, password });
    } else {
      await setLoginCredentials(null);
    }
    
    onLoginSuccess();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Attendance Login</Text>
        <Text style={styles.subtitle}>Use your mock credentials to continue.</Text>

        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888888"
          autoCapitalize="none"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888888"
          secureTextEntry={!showPassword}
        />

        <View style={styles.checkboxRow}>
          <Pressable style={styles.checkboxContainer} onPress={() => setShowPassword(!showPassword)}>
            <View style={[styles.checkbox, showPassword && styles.checkboxChecked]}>
              {showPassword && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Show Password</Text>
          </Pressable>
        </View>

        <View style={styles.checkboxRow}>
          <Pressable style={styles.checkboxContainer} onPress={() => setRememberMe(!rememberMe)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Remember Me</Text>
          </Pressable>
        </View>

        {hasError ? <Text style={styles.errorText}>Invalid username or password.</Text> : null}

        <Pressable
          style={[styles.loginButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit}
        >
          <Text style={styles.loginText}>Login</Text>
        </Pressable>

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>Mock Username: worker</Text>
          <Text style={styles.hintText}>Mock Password: 123456</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    color: '#111111',
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  input: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    marginBottom: 12,
    color: '#111111',
  },
  checkboxRow: {
    marginBottom: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#666666',
    fontSize: 14,
  },
  errorText: {
    color: '#333333',
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#000000',
    borderRadius: 999,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
    gap: 4,
  },
  hintText: {
    color: '#444444',
    fontSize: 13,
  },
});
