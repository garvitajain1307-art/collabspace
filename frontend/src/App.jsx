import "./socket";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { setUser } from './features/auth/authSlice';
import { setNotificationsData } from './features/notification/notificationSlice';
import { setMyInvitations } from './features/invitation/invitationSlice';
import { ToastProvider } from './components/common/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import api from './services/api';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard/Dashboard';
import WorkspacesPage from './pages/workspaces/WorkspacesPage';
import WorkspaceHome from './pages/Workspace/WorkspaceHome';
import WorkspaceMembers from './pages/Workspace/WorkspaceMembers';
import CollaborationPage from './pages/CollaborationPage';
import InvitationsPage from './pages/invitations/InvitationsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ActivityHistoryPage from './pages/activity/ActivityHistoryPage';
import SettingsPage from './pages/settings/SettingsPage';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await api.get('/api/v1/user/getMe');
        if (data.success) {
          dispatch(setUser(data.user));
          // Pre-fetch notifications and invitations for sidebar badge counts
          try {
            const notifData = await api.get('/api/v1/notification?limit=20');
            dispatch(setNotificationsData(notifData));
          } catch (_) {}
          try {
            const invData = await api.get('/api/v1/invitation/getMyInvitations');
            dispatch(setMyInvitations(invData.invitations || []));
          } catch (_) {}
        }
      } catch (_) {
        // Not authenticated — fine
      } finally {
        setAuthChecked(true);
      }
    };
    init();
  }, [dispatch]);

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-stone-400 font-medium">Loading CollabSpace…</p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workspaces" element={<ProtectedRoute><WorkspacesPage /></ProtectedRoute>} />
          <Route path="/workspace/:workspaceId" element={<ProtectedRoute><WorkspaceHome /></ProtectedRoute>} />
          <Route path="/workspace/:workspaceId/members" element={<ProtectedRoute><WorkspaceMembers /></ProtectedRoute>} />
          <Route path="/workspace/:workspaceId/activity" element={<ProtectedRoute><ActivityHistoryPage /></ProtectedRoute>} />
          <Route path="/collaboration/:documentId" element={<ProtectedRoute><CollaborationPage /></ProtectedRoute>} />
          <Route path="/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
