// store/slices/uiSlice.js
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
