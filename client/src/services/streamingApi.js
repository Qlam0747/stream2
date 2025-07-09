import axios from 'axios';
import { getApiBaseUrl } from '../utils/constants';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const fetchCurrentUser = async () => {
  try {
    const response = await apiClient.get('/api/users/me');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch user');
  }
};

export const getStreamStats = async (streamId) => {
  try {
    const response = await apiClient.get(`/api/streams/${streamId}/stats`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get stream stats');
  }
};

export const startStream = async (streamData) => {
  try {
    const response = await apiClient.post('/api/streams/start', streamData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to start stream');
  }
};

export const stopStream = async (streamId) => {
  try {
    const response = await apiClient.post(`/api/streams/${streamId}/stop`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to stop stream');
  }
};

export const getStreamList = async (params = {}) => {
  try {
    const response = await apiClient.get('/api/streams', { params });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get stream list');
  }
};

export const getStreamDetails = async (streamId) => {
  try {
    const response = await apiClient.get(`/api/streams/${streamId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get stream details');
  }
};

export const login = async (credentials) => {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (userData) => {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const updateStreamSettings = async (streamId, settings) => {
  try {
    const response = await apiClient.put(`/api/streams/${streamId}/settings`, settings);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update stream settings');
  }
};

export const sendHeartbeat = async (streamId) => {
  try {
    const response = await apiClient.post(`/api/streams/${streamId}/heartbeat`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to send heartbeat');
  }
};