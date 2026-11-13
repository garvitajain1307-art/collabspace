import { createSlice } from "@reduxjs/toolkit";

const collaboratorSlice = createSlice({
  name: "collaborator",
  initialState: {
    collaborators: [],
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
    setCollaborators: (state, action) => {
      state.collaborators = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    updateCollaboratorInList: (state, action) => {
      const { userId, permission } = action.payload;
      state.collaborators = state.collaborators.map((c) => {
        const id = c.user?._id || c.user?.id || c.user;
        return String(id) === String(userId) ? { ...c, permission } : c;
      });
    },
    removeCollaboratorFromList: (state, action) => {
      const userId = action.payload;
      state.collaborators = state.collaborators.filter((c) => {
        const id = c.user?._id || c.user?.id || c.user;
        return String(id) !== String(userId);
      });
    },
    clearCollaborators: (state) => {
      state.collaborators = [];
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
  setCollaborators,
  updateCollaboratorInList,
  removeCollaboratorFromList,
  clearCollaborators,
  setError,
  clearError,
} = collaboratorSlice.actions;

export default collaboratorSlice.reducer;
