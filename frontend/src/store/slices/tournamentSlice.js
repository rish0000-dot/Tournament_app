// store/slices/tournamentSlice.js
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
