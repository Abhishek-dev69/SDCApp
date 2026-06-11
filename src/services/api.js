import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { resetToLogin } from '../navigation/navigationRef';
import { clearSession } from './sessionManager';
import { Alert } from 'react-native';
export const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  'https://sdcapp-backend-456970553309.asia-south1.run.app';

export const AUTH_TOKEN_KEY = 'userToken';
const LEGACY_TOKEN_KEY = 'token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function getAuthToken() {
  const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
  if (token) return token;

  const legacyToken = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
  if (legacyToken) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
  }

  return legacyToken;
}

export async function saveAuthToken(token) {
  if (!token) return;
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function clearAuthToken() {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
  } = options;

  const requestHeaders = {
    ...headers,
  };

  if (body !== undefined) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
  }

  if (auth) {
    const token = await getAuthToken();
    if (token) requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_err) {
      data = { message: text };
    }
  }

  if (response.status === 401) {
  await clearAuthToken();
  clearSession();
  Alert.alert(
    'Session Expired',
    'Your session has expired. Please log in again.',
    [{ text: 'OK', onPress: () => resetToLogin() }]
  );
  throw new ApiError('Session expired. Please log in again.', 401, data);
}

  if (!response.ok) {
    throw new ApiError(
      data?.error || data?.message || 'Request failed',
      response.status,
      data
    );
  }

  return data;
}


export const fetchAndStoreProfile = async (setUserProfile) => {
  const data = await apiRequest('/auth/user/profile', {
    method: 'GET',
    auth: true,
  });
  setUserProfile(data);
  return data;
};