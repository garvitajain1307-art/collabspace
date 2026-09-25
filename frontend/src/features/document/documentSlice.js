import { createSlice } from "@reduxjs/toolkit";

const documentSlice = createSlice({
    
    name: "document",

    
    initialState: {
       
        documents: [],
        selectedDocument: null,
        loading: false,
        error: null
    },

    reducers: {

       
        setDocuments: (state, action) => {
            state.documents = action.payload;
            state.loading = false;
            state.error = null;
        },
        setSelectedDocument: (state, action) => {
            state.selectedDocument = action.payload;

            state.loading = false;
            state.error = null;
        },
        clearSelectedDocument: (state) => {
            state.selectedDocument = null;
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
    setDocuments,
    setSelectedDocument,
    clearSelectedDocument,
    setLoading,
    setError,
    clearError
} = documentSlice.actions;

export default documentSlice.reducer;