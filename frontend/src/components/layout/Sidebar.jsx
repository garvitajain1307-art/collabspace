import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard,
  Layers,
  Mail,
  Bell,
  Settings,
  LogOut,
  ChevronUp,
  Plus,
  Compass,
} from "lucide-react";
import { logoutUser } from "../../features/auth/authSlice";
import api from "../../services/api";
import Avatar, { getColorForString } from "../common/Avatar";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useToast } from "../common/Toast";

export const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { workspaces } = useSelector((state) => state.workspace);
  const { unreadCount } = useSelector((state) => state.notification);
  const { myInvitations } = useSelector((state) => state.invitation);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Workspaces",
      path: "/workspaces",
      icon: Layers,
    },
    {
      label: "Invitations",
      path: "/invitations",
      icon: Mail,
      badge: myInvitations?.length || 0,
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: Bell,
      badge: unreadCount || 0,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.get("/api/v1/user/logout");
      dispatch(logoutUser());
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      // Even if network fails, clear local auth
      dispatch(logoutUser());
      navigate("/login");
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  // Up to 4 recent workspaces for sidebar
  const recentWorkspaces = workspaces?.slice(0, 4) || [];

  return (
    <>
      <aside
        className={`h-screen bg-stone-50/80 border-r border-stone-200 flex flex-col justify-between shrink-0 select-none transition-all duration-200 z-30 ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Top: Logo & Nav */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-stone-200/60">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 font-semibold text-stone-900 group"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white shadow-xs group-hover:bg-violet-700 transition duration-150">
                <Compass size={18} strokeWidth={2.2} />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-bold tracking-tight text-stone-900">
                    CollabSpace
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal -mt-0.5">
                    Workspace
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === "/workspaces"
                  ? location.pathname.startsWith("/workspace")
                  : location.pathname === item.path;

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition duration-150 group cursor-pointer ${
                    isActive
                      ? "bg-violet-50 text-violet-700 font-semibold shadow-2xs"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.2 : 1.75}
                      className={isActive ? "text-violet-600" : "text-stone-400 group-hover:text-stone-600"}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isActive
                          ? "bg-violet-600 text-white"
                          : "bg-violet-100 text-violet-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Recent Workspaces section */}
            {!isCollapsed && (
              <div className="pt-4 mt-2 border-t border-stone-200/60">
                <div className="px-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-2">
                  <span>Workspaces</span>
                  <Link
                    to="/workspaces"
                    className="hover:text-stone-600 p-0.5 rounded cursor-pointer"
                    title="View all workspaces"
                  >
                    <Plus size={14} />
                  </Link>
                </div>

                <div className="space-y-0.5">
                  {recentWorkspaces.map((ws) => {
                    const isActive = location.pathname.includes(`/workspace/${ws._id}`);
                    const initials = ws.name.slice(0, 2).toUpperCase();
                    const tagColor = getColorForString(ws.name);

                    return (
                      <Link
                        key={ws._id}
                        to={`/workspace/${ws._id}`}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs transition duration-150 cursor-pointer ${
                          isActive
                            ? "bg-violet-50 text-violet-900 font-semibold"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-bold shrink-0 border ${tagColor}`}
                        >
                          {initials}
                        </span>
                        <span className="truncate">{ws.name}</span>
                      </Link>
                    );
                  })}
                  {recentWorkspaces.length === 0 && (
                    <div className="px-3 py-2 text-xs text-stone-400 italic">
                      No workspaces yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Profile & Logout */}
        <div className="p-3 border-t border-stone-200/60 bg-stone-50/50 relative">
          {profileMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-white rounded-xl shadow-lg border border-stone-200 p-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <Link
                to="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                <Settings size={15} className="text-stone-400" />
                <span>Account settings</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              >
                <LogOut size={15} />
                <span>Log out</span>
              </button>
            </div>
          )}

          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-100 transition duration-150 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <Avatar name={user?.name || "User"} size="sm" />
              {!isCollapsed && (
                <div className="flex flex-col text-left overflow-hidden">
                  <span className="text-xs font-semibold text-stone-900 truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-[10px] text-stone-400 truncate -mt-0.5">
                    {user?.email || ""}
                  </span>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <ChevronUp
                size={15}
                className={`text-stone-400 transition-transform duration-150 ${
                  profileMenuOpen ? "rotate-180" : ""
                }`}
              />
            )}
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Confirm logout"
        description="Are you sure you want to end your current session?"
      >
        <div className="flex items-center justify-end gap-2.5 pt-2">
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
            Log out
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default Sidebar;
