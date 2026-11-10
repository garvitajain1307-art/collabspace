
import { createSlice } from "@reduxjs/toolkit";

const folderSlice = createSlice({
    name: "folder",

    initialState: {
        folders: [],
        selectedFolder: null,
        loading: false,
        error: null
    },

    reducers: {
        setFolders: (state, action) => {
            state.folders = action.payload;
            state.loading = false;
            state.error = null;
        },

        setSelectedFolder: (state, action) => {
            state.selectedFolder = action.payload;
        },

        clearSelectedFolder: (state) => {
            state.selectedFolder = null;
        },

        setLoading: (state) => {
            state.loading = true;
            state.error = null;
        },

        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },

        clearError: (state) => {
            state.error = null;
        }
    }
});

export const {
    setFolders,
    setSelectedFolder,
    clearSelectedFolder,
    setLoading,
    setError,
    clearError
} = folderSlice.actions;

export default folderSlice.reducer;
