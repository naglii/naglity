// Axios instance for the mobile app.
// Unlike web (httpOnly cookie), RN sends the JWT as an Authorization: Bearer header —
// the API's JwtStrategy accepts both (cookie first, Bearer fallback).
import axios from 'axios';
import { router } from 'expo-router';
import { clearAuth, getTokenSync } from './auth';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// Attach the bearer token (read synchronously from the in-memory mirror).
api.interceptors.request.use((config) => {
  const token = getTokenSync();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      await clearAuth();
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  },
);

export default api;
