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

// ============================================
// store/slices/walletSlice.js
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchWallet = createAsyncThunk('wallet/fetch', async (_, { rejectWithValue }) => {
  try { return await api.get('/wallet'); }
  catch (err) { return rejectWithValue(err); }
});

export const redeemCoins = createAsyncThunk('wallet/redeem', async (coins, { rejectWithValue }) => {
  try { return await api.post('/wallet/redeem-coins', { coins }); }
  catch (err) { return rejectWithValue(err.message); }
});

export const watchAd = createAsyncThunk('wallet/watchAd', async (_, { rejectWithValue }) => {
  try { return await api.post('/coins/ad-watch'); }
  catch (err) { return rejectWithValue(err.message); }
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    realCash: 0, bonusCash: 0, blazegold: 0,
    transactions: [], coinTransactions: [],
    isLoading: false, error: null,
  },
  reducers: {
    updateBalance: (state, action) => {
      if (action.payload.realCash !== undefined) state.realCash = action.payload.realCash;
      if (action.payload.blazegold !== undefined) state.blazegold = action.payload.blazegold;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWallet.pending, (s) => { s.isLoading = true; })
      .addCase(fetchWallet.fulfilled, (s, a) => {
        s.isLoading = false;
        if (a.payload.success) {
          const w = a.payload.data.wallet;
          s.realCash = w.real_cash;
          s.bonusCash = w.bonus_cash;
          s.blazegold = w.blazegold;
          s.transactions = a.payload.data.recent_transactions;
          s.coinTransactions = a.payload.data.coin_transactions;
        }
      })
      .addCase(fetchWallet.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; });
  },
});

export const { updateBalance } = walletSlice.actions;
export default walletSlice.reducer;

// ============================================
// store/slices/tournamentSlice.js
// ============================================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchTournaments = createAsyncThunk(
  'tournaments/fetch',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams(filters).toString();
      return await api.get(`/tournaments?${params}`);
    } catch (err) { return rejectWithValue(err); }
  }
);

export const fetchTournamentDetail = createAsyncThunk(
  'tournaments/fetchDetail',
  async (id, { rejectWithValue }) => {
    try { return await api.get(`/tournaments/${id}`); }
    catch (err) { return rejectWithValue(err); }
  }
);

export const joinTournament = createAsyncThunk(
  'tournaments/join',
  async ({ id, payment_method }, { rejectWithValue }) => {
    try { return await api.post(`/tournaments/${id}/join`, { payment_method }); }
    catch (err) { return rejectWithValue(err.message || 'Failed to join'); }
  }
);

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState: {
    list: [], myTournaments: [], selected: null,
    isLoading: false, isJoining: false, error: null,
    filters: { mode: null, is_free: null },
  },
  reducers: {
    setFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelected: (state) => { state.selected = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.pending, (s) => { s.isLoading = true; })
      .addCase(fetchTournaments.fulfilled, (s, a) => {
        s.isLoading = false;
        if (a.payload.success) s.list = a.payload.data.tournaments;
      })
      .addCase(fetchTournaments.rejected, (s, a) => { s.isLoading = false; s.error = a.payload; })

      .addCase(fetchTournamentDetail.fulfilled, (s, a) => {
        if (a.payload.success) s.selected = a.payload.data;
      })

      .addCase(joinTournament.pending, (s) => { s.isJoining = true; })
      .addCase(joinTournament.fulfilled, (s) => { s.isJoining = false; })
      .addCase(joinTournament.rejected, (s, a) => { s.isJoining = false; s.error = a.payload; });
  },
});

export const { setFilter, clearSelected } = tournamentSlice.actions;
export default tournamentSlice.reducer;

// ============================================
// store/slices/uiSlice.js
// ============================================
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeTab: 'Home',
    toast: null,
    modals: { deposit: false, withdraw: false, redeem: false },
    language: 'hi',
  },
  reducers: {
    setActiveTab: (state, action) => { state.activeTab = action.payload; },
    showToast: (state, action) => { state.toast = action.payload; },
    hideToast: (state) => { state.toast = null; },
    toggleModal: (state, action) => {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    setLanguage: (state, action) => { state.language = action.payload; },
  },
});

export const { setActiveTab, showToast, hideToast, toggleModal, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;
