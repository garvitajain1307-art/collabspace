import { createSlice } from "@reduxjs/toolkit";

const commentSlice = createSlice({
  name: "comment",
  initialState: {
    comments: [],
    filter: "open", // "open" | "resolved" | "all"
    selectedCommentId: null,
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
    setComments: (state, action) => {
      state.comments = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    addComment: (state, action) => {
      state.comments.push(action.payload);
    },
    updateCommentInList: (state, action) => {
      const updated = action.payload;
      state.comments = state.comments.map((c) =>
        c._id === updated._id ? { ...c, ...updated } : c
      );
    },
    removeCommentFromList: (state, action) => {
      const commentId = action.payload;
      state.comments = state.comments.filter((c) => c._id !== commentId);
      if (state.selectedCommentId === commentId) {
        state.selectedCommentId = null;
      }
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setSelectedCommentId: (state, action) => {
      state.selectedCommentId = action.payload;
    },
    clearComments: (state) => {
      state.comments = [];
      state.selectedCommentId = null;
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
  setComments,
  addComment,
  updateCommentInList,
  removeCommentFromList,
  setFilter,
  setSelectedCommentId,
  clearComments,
  setError,
  clearError,
} = commentSlice.actions;

export default commentSlice.reducer;
