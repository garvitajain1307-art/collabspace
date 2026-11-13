import { createSlice } from "@reduxjs/toolkit";

const documentSlice = createSlice({
  name: "document",
  initialState: {
    documents: [],
    selectedDocument: null,
    documentAccess: "viewer", // "owner" | "editor" | "viewer" | "none"
    onlineUsers: [], // [{ userId, name }]
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
    setDocuments: (state, action) => {
      state.documents = action.payload || [];
      state.loading = false;
      state.error = null;
    },
    setSelectedDocument: (state, action) => {
      state.selectedDocument = action.payload;
      state.loading = false;
      state.error = null;
    },
    setDocumentAccess: (state, action) => {
      state.documentAccess = action.payload;
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload || [];
    },
    addOnlineUser: (state, action) => {
      const user = action.payload;
      if (!state.onlineUsers.some((u) => String(u.userId) === String(user.userId))) {
        state.onlineUsers.push(user);
      }
    },
    removeOnlineUser: (state, action) => {
      const { userId } = action.payload;
      state.onlineUsers = state.onlineUsers.filter(
        (u) => String(u.userId) !== String(userId)
      );
    },
    clearSelectedDocument: (state) => {
      state.selectedDocument = null;
      state.documentAccess = "viewer";
      state.onlineUsers = [];
    },
    addDocument: (state, action) => {
      state.documents.push(action.payload);
    },
    updateDocumentInList: (state, action) => {
      const updated = action.payload;
      state.documents = state.documents.map((doc) =>
        doc._id === updated._id ? { ...doc, ...updated } : doc
      );
      if (state.selectedDocument?._id === updated._id) {
        state.selectedDocument = { ...state.selectedDocument, ...updated };
      }
    },
    removeDocumentFromList: (state, action) => {
      const documentId = action.payload;
      state.documents = state.documents.filter((doc) => doc._id !== documentId);
      if (state.selectedDocument?._id === documentId) {
        state.selectedDocument = null;
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
  setDocuments,
  setSelectedDocument,
  setDocumentAccess,
  setOnlineUsers,
  addOnlineUser,
  removeOnlineUser,
  clearSelectedDocument,
  addDocument,
  updateDocumentInList,
  removeDocumentFromList,
  setError,
  clearError,
} = documentSlice.actions;

export default documentSlice.reducer;
