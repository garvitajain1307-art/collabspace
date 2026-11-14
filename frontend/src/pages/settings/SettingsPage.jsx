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
  Sun,
  Moon,
  Sparkles,
  Command,
  Users2,
  Workflow,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Avatar from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { useToast } from "../../components/common/Toast";
import { useTheme } from "../../context/ThemeContext";
import api from "../../services/api";
import { logoutUser } from "../../features/auth/authSlice";

export const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();
  const { theme, setTheme, isDark } = useTheme();

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
    <div className="flex h-screen w-full bg-stone-50 dark:bg-stone-950 overflow-hidden text-stone-900 dark:text-stone-100">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50 dark:bg-stone-950">
        <Topbar
          title="Account Settings"
          breadcrumbs={[{ label: "Settings" }]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Settings Forms and Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Settings & Profile
                </h1>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Manage your personal details and application preferences
                </p>
              </div>

              {/* Profile Card */}
              <div className="p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar
                    name={user?.name || "User"}
                    src={user?.avatar}
                    size="xl"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                      {user?.name || "User"}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{user?.email}</p>
                    <span className="inline-block mt-2 text-[10px] bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-semibold px-2 py-0.5 rounded-full border border-stone-200 dark:border-stone-700">
                      Account ID: {user?.id || user?._id || "—"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
                  <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 dark:text-stone-500 font-medium block mb-1">
                      Full Name
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {user?.name}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-stone-50/70 dark:bg-stone-800/40 border border-stone-200/60 dark:border-stone-700/60">
                    <span className="text-stone-400 dark:text-stone-500 font-medium block mb-1">
                      Email Address
                    </span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200">
                      {user?.email}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appearance / Theme Toggle */}
              <div className="p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Palette size={17} className="text-violet-600 dark:text-violet-400" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Workspace Theme
                    </h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300">
                    {isDark ? "Dark theme active" : "Light theme active"}
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Select your interface theme. Both themes feature custom contrast, warm neutrals, and restrained violet accents.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Light Theme Card */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      !isDark
                        ? "border-violet-600 dark:border-violet-500 bg-stone-50 dark:bg-stone-800/80 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                      <Sun size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Warm Ivory Light
                        </span>
                        {!isDark && <Check size={14} className="text-violet-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                        Subtle warm ivory canvas with balanced dark grey text
                      </p>
                    </div>
                  </div>

                  {/* Dark Theme Card */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 select-none ${
                      isDark
                        ? "border-violet-500 bg-stone-800 shadow-xs"
                        : "border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-950/70 text-violet-300 flex items-center justify-center shrink-0 border border-violet-800/60">
                      <Moon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          Charcoal Obsidian Dark
                        </span>
                        {isDark && <Check size={14} className="text-violet-400" />}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                        Deep charcoal surfaces with muted lavender accents
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Membership Summary */}
              <div className="p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <Layers size={17} className="text-violet-600 dark:text-violet-400" />
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Workspaces Overview
                  </h3>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  You are currently an active member of {workspaces?.length || 0} workspaces.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {workspaces?.map((ws) => (
                    <span
                      key={ws._id}
                      className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium border border-stone-200 dark:border-stone-700"
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

              {/* Session & Sign Out */}
              <div className="p-6 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Sign Out</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                    End your active session on this device
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={LogOut}
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/60"
                  onClick={() => setLogoutModalOpen(true)}
                >
                  Sign out
                </Button>
              </div>
            </div>

            {/* Right 5 Columns: Decorative Editorial Visual Panel */}
            <div className="lg:col-span-5 sticky top-8">
              <div className="relative overflow-hidden rounded-3xl border border-stone-200/90 dark:border-stone-800/80 bg-gradient-to-br from-stone-100 via-white to-violet-50/50 dark:from-stone-900 dark:via-stone-900/95 dark:to-stone-950 p-7 shadow-xs">
                {/* Decorative Layered Geometric Background Gradients */}
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-violet-400/10 dark:bg-violet-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-purple-500/10 dark:bg-purple-700/10 blur-3xl pointer-events-none" />

                {/* Header Badge */}
                <div className="relative z-10 flex items-center justify-between mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40">
                    <Sparkles size={11} />
                    Knowledge Canvas
                  </div>
                  <span className="text-[11px] text-stone-400 font-medium">
                    CollabSpace v1.0
                  </span>
                </div>

                {/* Abstract Geometric Workspace Illustration */}
                <div className="relative z-10 my-4 p-5 rounded-2xl bg-white/70 dark:bg-stone-950/50 backdrop-blur-md border border-stone-200/70 dark:border-stone-800/70 shadow-xs">
                  {/* Layered mock cards representing collaborative documents */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                          Real-time Sync Node
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Yjs · CRDT
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-1">
                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 flex flex-col items-center text-center">
                        <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-1.5">
                          <FileText size={12} />
                        </div>
                        <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                          Documents
                        </span>
                        <span className="text-[9px] text-stone-400">Structured</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 flex flex-col items-center text-center">
                        <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-1.5">
                          <Users2 size={12} />
                        </div>
                        <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                          Presence
                        </span>
                        <span className="text-[9px] text-stone-400">Live peers</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 flex flex-col items-center text-center">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5">
                          <Workflow size={12} />
                        </div>
                        <span className="text-[10px] font-bold text-stone-700 dark:text-stone-300">
                          Hierarchy
                        </span>
                        <span className="text-[9px] text-stone-400">Nested</span>
                      </div>
                    </div>

                    {/* Miniature simulated editor preview */}
                    <div className="p-3 rounded-xl bg-stone-50/80 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 space-y-2">
                      <div className="h-2 w-3/4 bg-stone-200 dark:bg-stone-700 rounded-full" />
                      <div className="h-1.5 w-full bg-stone-200/70 dark:bg-stone-800 rounded-full" />
                      <div className="h-1.5 w-5/6 bg-stone-200/70 dark:bg-stone-800 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Editorial Description */}
                <div className="relative z-10 pt-2 space-y-2">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                    Engineered for Focus & Fluid Teamwork
                  </h4>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
                    CollabSpace merges nested IDE-grade folder navigation with real-time peer editing, threaded inline discussions, and granular permission controls.
                  </p>
                </div>
              </div>
            </div>
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
