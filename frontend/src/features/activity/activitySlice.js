import { createSlice } from "@reduxjs/toolkit";

const activitySlice = createSlice({
  name: "activity",
  initialState: {
    activities: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 1,
    loading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = typeof action.payload === "boolean" ? action.payload : true;
      if (state.loading) {
        state.error = null;
      }
    },
    setActivitiesData: (state, action) => {
      const { activities, totalCount, currentPage, totalPages, append } = action.payload;
      if (append) {
        state.activities = [...state.activities, ...(activities || [])];
      } else {
        state.activities = activities || [];
      }
      state.totalCount = totalCount ?? 0;
      state.currentPage = currentPage ?? 1;
      state.totalPages = totalPages ?? 1;
      state.loading = false;
      state.error = null;
    },
    clearActivities: (state) => {
      state.activities = [];
      state.totalCount = 0;
      state.currentPage = 1;
      state.totalPages = 1;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setLoading,
  setActivitiesData,
  clearActivities,
  setError,
  clearError,
} = activitySlice.actions;

export default activitySlice.reducer;
