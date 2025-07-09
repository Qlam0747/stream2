import axios from 'axios';
import { getApiBaseUrl } from '../utils/constants';

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
});

export const loginWithEmail = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      return response.data.user;
    }
    
    throw new Error('No token received');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const loginWithSocial = async (provider, token) => {
  try {
    const response = await apiClient.post(`/auth/login/${provider}`, { token });
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      return response.data.user;
    }
    
    throw new Error('No token received');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Social login failed');
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await apiClient.post('/auth/register', userData);
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      return response.data.user;
    }
    
    throw new Error('No token received');
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const logout = () => {
  localStorage.removeItem('authToken');
  // Additional cleanup if needed
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  try {
    const response = await apiClient.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    logout();
    return null;
  }
};

export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/auth/refresh');
    
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
      return response.data.token;
    }
    
    throw new Error('No token received');
  } catch (error) {
    logout();
    throw new Error(error.response?.data?.message || 'Token refresh failed');
  }
};

export const requestPasswordReset = async (email) => {
  try {
    await apiClient.post('/auth/reset-password', { email });
    return true;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Password reset request failed');
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await apiClient.get(`/auth/reset-password/${token}`);
    return response.data.valid;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Invalid reset token');
  }
};

export const updatePassword = async (token, newPassword) => {
  try {
    const response = await apiClient.post(`/auth/reset-password/${token}`, { newPassword });
    return response.data.success;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Password update failed');
  }
};