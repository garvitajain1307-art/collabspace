import {createSlice} from "@reduxjs/toolkit";

const workspaceSlice=createSlice({
    name:"workspace",
    initialState:{
        workspaces:[],
        selectedWorkspace:null,
        loading:false,
        error:null
    },
    reducers:{

        setWorkspaces:(state,action)=>{
            state.workspaces=action.payload;
            state.loading=false;
            state.error=null;

        },
        setSelectedWorkspace:(state,action)=>{
            state.selectedWorkspace=action.payload;
            state.loading=false;
            state.error = null;
            
        },
        clearSelectedWorkspace:(state)=>{
            state.selectedWorkspace=null;
            
        },
        setLoading:(state)=>{
            state.loading=true;
            state.error=null;
        },

        setError:(state,action)=>{
            state.error=action.payload;
            state.loading=false;
        },
        clearError:(state)=>{
            state.error=null;
        }
    }
});

export const {setWorkspaces, setSelectedWorkspace, clearSelectedWorkspace, setLoading, setError, clearError}=workspaceSlice.actions;
export default workspaceSlice.reducer;