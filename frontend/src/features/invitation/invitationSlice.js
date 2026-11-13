import { createSlice } from "@reduxjs/toolkit";

const invitationSlice = createSlice({
  name: "invitation",
  initialState: {
    myInvitations: [],
    workspaceInvitations: [],
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
    setMyInvitations: (state, action) => {
      state.myInvitations = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setWorkspaceInvitations: (state, action) => {
      state.workspaceInvitations = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    removeMyInvitation: (state, action) => {
      const id = action.payload;
      state.myInvitations = state.myInvitations.filter((inv) => inv._id !== id);
    },
    removeWorkspaceInvitation: (state, action) => {
      const id = action.payload;
      state.workspaceInvitations = state.workspaceInvitations.filter((inv) => inv._id !== id);
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
  setMyInvitations,
  setWorkspaceInvitations,
  removeMyInvitation,
  removeWorkspaceInvitation,
  setError,
  clearError,
} = invitationSlice.actions;

export default invitationSlice.reducer;
