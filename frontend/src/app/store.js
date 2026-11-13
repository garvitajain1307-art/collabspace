import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import workspaceReducer from "../features/workspace/workspaceSlice";
import folderReducer from "../features/folder/folderSlice";
import documentReducer from "../features/document/documentSlice";
import invitationReducer from "../features/invitation/invitationSlice";
import commentReducer from "../features/comment/commentSlice";
import collaboratorReducer from "../features/collaborator/collaboratorSlice";
import notificationReducer from "../features/notification/notificationSlice";
import activityReducer from "../features/activity/activitySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    folder: folderReducer,
    document: documentReducer,
    invitation: invitationReducer,
    comment: commentReducer,
    collaborator: collaboratorReducer,
    notification: notificationReducer,
    activity: activityReducer,
  },
});

export default store;
