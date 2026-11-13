import { createSlice } from "@reduxjs/toolkit";

const folderSlice = createSlice({
  name: "folder",
  initialState: {
    folders: [],
    selectedFolder: null,
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
    setFolders: (state, action) => {
      state.folders = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setSelectedFolder: (state, action) => {
      state.selectedFolder = action.payload;
    },
    clearSelectedFolder: (state) => {
      state.selectedFolder = null;
    },
    addFolder: (state, action) => {
      state.folders.push(action.payload);
    },
    updateFolderInList: (state, action) => {
      const updated = action.payload;
      state.folders = state.folders.map((f) =>
        f._id === updated._id ? { ...f, ...updated } : f
      );
      if (state.selectedFolder?._id === updated._id) {
        state.selectedFolder = { ...state.selectedFolder, ...updated };
      }
    },
    removeFolderFromList: (state, action) => {
      const folderId = action.payload;
      state.folders = state.folders.filter((f) => f._id !== folderId);
      if (state.selectedFolder?._id === folderId) {
        state.selectedFolder = null;
      }
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
  setFolders,
  setSelectedFolder,
  clearSelectedFolder,
  addFolder,
  updateFolderInList,
  removeFolderFromList,
  setError,
  clearError,
} = folderSlice.actions;

export default folderSlice.reducer;
