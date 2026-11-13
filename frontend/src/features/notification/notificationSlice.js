import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    notifications: [],
    unreadCount: 0,
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
    setNotificationsData: (state, action) => {
      const { notifications, unreadCount, totalCount, currentPage, totalPages } = action.payload;
      state.notifications = notifications || [];
      state.unreadCount = unreadCount ?? 0;
      state.totalCount = totalCount ?? 0;
      state.currentPage = currentPage ?? 1;
      state.totalPages = totalPages ?? 1;
      state.loading = false;
      state.error = null;
    },
    markAsReadInState: (state, action) => {
      const notificationId = action.payload;
      const target = state.notifications.find((n) => n._id === notificationId);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsReadInState: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    removeNotificationFromState: (state, action) => {
      const notificationId = action.payload;
      const target = state.notifications.find((n) => n._id === notificationId);
      if (target && !target.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
      state.notifications = state.notifications.filter((n) => n._id !== notificationId);
      state.totalCount = Math.max(0, state.totalCount - 1);
    },
    clearAllNotificationsInState: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.totalCount = 0;
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
  setNotificationsData,
  markAsReadInState,
  markAllAsReadInState,
  removeNotificationFromState,
  clearAllNotificationsInState,
  setError,
  clearError,
} = notificationSlice.actions;

export default notificationSlice.reducer;
