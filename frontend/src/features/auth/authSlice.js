import createSlice from "@reduxjs/toolkit";

const authSlice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        isAuthenticated:false,
        loading:false,
        error:null
    },
    reducers:{
        setLoading:(state)=>{
            state.loading=true;
            state.error=null;
        },

        setUser:(state,action)=>{
            state.user=action.payload;
            state.isAuthenticated=true;
            state.error=null;
            state.loading=false;
        },
        logoutUser:(state)=>{
            state.user=null;
            state.isAuthenticated=false;
            state.error=null;
            state.loading=false;
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

export const {setLoading,setUser,logoutUser,setError,clearError}=authSlice.actions;
export default authSlice.reducer;