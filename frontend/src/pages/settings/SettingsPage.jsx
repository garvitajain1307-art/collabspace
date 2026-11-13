import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Shield,
  Layers,
  FileText,
  LogOut,
  Palette,
  Check,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import { logoutUser } from "../../features/auth/authSlice";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { workspaces } = useSelector((state) => state.workspace);

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.get("/api/v1/user/logout");
      dispatch(logoutUser());
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (e) {
      dispatch(logoutUser());
      navigate("/login");
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title="Account Settings"
          breadcrumbs={[{ label: "Settings" }]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-3xl">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Settings & Profile
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage your personal details and application preferences
            </p>
          </div>

          {/* Profile Card */}
          <div className="p-6 rounded-2xl border border-stone-200/80 bg-white shadow-2xs space-y-6">
            <div className="flex items-center gap-4">
              <Avatar
                name={user?.name || "User"}
                src={user?.avatar}
                size="xl"
              />
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  {user?.name || "User"}
                </h2>
                <p className="text-xs text-stone-500">{user?.email}</p>
                <span className="inline-block mt-2 text-[10px] bg-stone-100 text-stone-600 font-semibold px-2 py-0.5 rounded-full border border-stone-200">
                  Account ID: {user?.id || user?._id || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200/60">
                <span className="text-stone-400 font-medium block mb-1">
                  Full Name
                </span>
                <span className="font-semibold text-stone-800">
                  {user?.name}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50/70 border border-stone-200/60">
                <span className="text-stone-400 font-medium block mb-1">
                  Email Address
                </span>
                <span className="font-semibold text-stone-800">
                  {user?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Workspace Membership Summary */}
          <div className="p-6 rounded-2xl border border-stone-200/80 bg-white shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Layers size={17} className="text-violet-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Workspaces Overview
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              You are currently an active member of {workspaces?.length || 0} workspaces.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {workspaces?.map((ws) => (
                <span
                  key={ws._id}
                  className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium border border-stone-200"
                >
                  {ws.name}
                </span>
              ))}
              {(!workspaces || workspaces.length === 0) && (
                <span className="text-xs text-stone-400 italic">
                  No workspaces joined yet.
                </span>
              )}
            </div>
          </div>

          {/* Appearance Preference */}
          <div className="p-6 rounded-2xl border border-stone-200/80 bg-white shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Palette size={17} className="text-violet-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Appearance
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              CollabSpace uses a human-designed warm ivory theme with restrained violet accents.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="p-3 rounded-xl border-2 border-violet-600 bg-stone-50 flex items-center gap-2 text-xs font-bold text-stone-900">
                <Check size={14} className="text-violet-600" />
                Warm Ivory Light Theme (Default)
              </div>
            </div>
          </div>

          {/* Session & Sign Out */}
          <div className="p-6 rounded-2xl border border-stone-200/80 bg-white shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Sign Out</h3>
              <p className="text-xs text-stone-500 mt-0.5">
                End your active session on this device
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
              onClick={() => setLogoutModalOpen(true)}
            >
              Sign out
            </Button>
          </div>
        </main>
      </div>

      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign out of CollabSpace?"
        description="You will need to sign in again to access your documents and workspaces."
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLogoutModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loggingOut}
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
