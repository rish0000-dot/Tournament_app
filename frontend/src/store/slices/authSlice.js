// store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export const sendOTP = createAsyncThunk('auth/sendOTP', async (phone, { rejectWithValue }) => {
  try {
    return await api.post('/auth/send-otp', { phone });
  } catch (err) { return rejectWithValue(err.message || 'Failed to send OTP'); }
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/verify-otp', data);
    if (res.success) {
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    }
    return res;
  } catch (err) { return rejectWithValue(err.message || 'OTP verification failed'); }
});

export const setupProfile = createAsyncThunk('auth/setupProfile', async (data, { rejectWithValue }) => {
  try {
    return await api.post('/auth/setup-profile', data);
  } catch (err) { return rejectWithValue(err.message || 'Profile setup failed'); }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const user = await AsyncStorage.getItem('user');
    if (token && user) return { token, user: JSON.parse(user) };
    return null;
  } catch (err) { return rejectWithValue(err); }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    return await api.get('/users/me');
  } catch (err) { return rejectWithValue(err); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null, token: null, isAuthenticated: false,
    isLoading: false, error: null, needsProfileSetup: false,
    otpSent: false, phone: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null; state.token = null;
      state.isAuthenticated = false;
      AsyncStorage.multiRemove(['token', 'user']);
    },
    clearError: (state) => { state.error = null; },
    setPhone: (state, action) => { state.phone = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendOTP.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(sendOTP.fulfilled, (s) => { s.isLoading = false; s.otpSent = true; })
      .addCase(sendOTP.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(verifyOTP.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(verifyOTP.fulfilled, (s, a) => {
        s.isLoading = false;
        if (a.payload.success) {
          s.token = a.payload.data.token;
          s.user = a.payload.data.user;
          s.isAuthenticated = !a.payload.data.needsProfileSetup;
          s.needsProfileSetup = a.payload.data.needsProfileSetup;
        }
      })
      .addCase(verifyOTP.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(setupProfile.fulfilled, (s, a) => {
        s.needsProfileSetup = false; s.isAuthenticated = true;
        s.user = { ...s.user, ...a.payload.data?.user };
      })

      .addCase(loadUser.fulfilled, (s, a) => {
        if (a.payload) {
          s.token = a.payload.token;
          s.user = a.payload.user;
          s.isAuthenticated = true;
        }
      })

      .addCase(fetchProfile.fulfilled, (s, a) => {
        if (a.payload.success) s.user = a.payload.data.user;
      });
  },
});

export const { logout, clearError, setPhone } = authSlice.actions;
export default authSlice.reducer;
