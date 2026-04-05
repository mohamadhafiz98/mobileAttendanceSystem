import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEYS } from '../constants/storage';

type SessionData = {
  isLoggedIn: boolean;
};

type LoginCredentials = {
  username: string;
  password: string;
};

export const getSession = async (): Promise<SessionData> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return { isLoggedIn: false };

  try {
    const parsed = JSON.parse(raw) as SessionData;
    return {
      isLoggedIn: Boolean(parsed?.isLoggedIn),
    };
  } catch {
    return { isLoggedIn: false };
  }
};

export const setLoggedIn = async (isLoggedIn: boolean): Promise<void> => {
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify({ isLoggedIn }));
};

export const getLoginCredentials = async (): Promise<LoginCredentials | null> => {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOGIN_CREDENTIALS);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as LoginCredentials;
    return parsed;
  } catch {
    return null;
  }
};

export const setLoginCredentials = async (credentials: LoginCredentials | null): Promise<void> => {
  if (credentials) {
    await AsyncStorage.setItem(STORAGE_KEYS.LOGIN_CREDENTIALS, JSON.stringify(credentials));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.LOGIN_CREDENTIALS);
  }
};
