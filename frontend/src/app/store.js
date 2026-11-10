import {configureStore} from '@reduxjs/toolkit';
import authReducer from "../features/auth/authSlice"
import workspaceReducer from "../features/workspace/workspaceSlice"
import documentReducer from "../features/document/documentSlice"
import folderReducer from "../features/folder/folderSlice"

export const store=configureStore({
    reducer:{
        auth:authReducer,
        workspace:workspaceReducer,
        document:documentReducer,
        folder:folderReducer
    }
})