import { createSlice } from "@reduxjs/toolkit";

const workspaceSlice = createSlice({
  name: "workspace",
  initialState: {
    workspaces: [],
    selectedWorkspace: null,
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
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setSelectedWorkspace: (state, action) => {
      state.selectedWorkspace = action.payload;
      state.loading = false;
      state.error = null;
    },
    addWorkspace: (state, action) => {
      state.workspaces.unshift(action.payload);
    },
    updateWorkspaceInList: (state, action) => {
      const updated = action.payload;
      state.workspaces = state.workspaces.map((ws) =>
        ws._id === updated._id ? { ...ws, ...updated } : ws
      );
      if (state.selectedWorkspace?._id === updated._id) {
        state.selectedWorkspace = { ...state.selectedWorkspace, ...updated };
      }
    },
    removeWorkspaceFromList: (state, action) => {
      const workspaceId = action.payload;
      state.workspaces = state.workspaces.filter((ws) => ws._id !== workspaceId);
      if (state.selectedWorkspace?._id === workspaceId) {
        state.selectedWorkspace = null;
      }
    },
    clearSelectedWorkspace: (state) => {
      state.selectedWorkspace = null;
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
  setWorkspaces,
  setSelectedWorkspace,
  addWorkspace,
  updateWorkspaceInList,
  removeWorkspaceFromList,
  clearSelectedWorkspace,
  setError,
  clearError,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;
