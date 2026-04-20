// store/slices/walletSlice.js
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
