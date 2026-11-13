import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bell,
  Search,
  Check,
  CheckCheck,
  Clock,
  Settings,
  LogOut,
  ExternalLink,
} from "lucide-react";
import Avatar from "../common/Avatar";
import { markAsReadInState, markAllAsReadInState } from "../../features/notification/notificationSlice";
import api from "../../services/api";

export const Topbar = ({
  title = "Dashboard",
  breadcrumbs = [],
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search workspaces and documents...",
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await api.patch(`/api/v1/notification/read/${notificationId}`);
      dispatch(markAsReadInState(notificationId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/api/v1/notification/read-all");
      dispatch(markAllAsReadInState());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xs border-b border-stone-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20">
      {/* Left: Breadcrumbs / Title */}
      <div className="flex items-center gap-2">
        {breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-stone-300">/</span>}
                {crumb.path ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-stone-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-stone-900 font-semibold truncate max-w-[200px]">
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <h1 className="text-base font-semibold text-stone-900 tracking-tight">
            {title}
          </h1>
        )}
      </div>

      {/* Right: Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Search bar */}
        {onSearchChange && (
          <div className="relative flex items-center">
            <Search
              size={15}
              className="absolute left-2.5 text-stone-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-56 lg:w-72 pl-8 pr-10 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition duration-150 text-stone-800 placeholder-stone-400"
            />
            <span className="absolute right-2 text-[10px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-mono font-medium select-none pointer-events-none">
              ⌘K
            </span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition relative cursor-pointer"
            title="Notifications"
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-600 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-stone-200 p-0 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                    Notifications
                  </h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
                {notifications?.slice(0, 5).map((notif) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      setNotificationOpen(false);
                      if (notif.document) {
                        navigate(`/collaboration/${notif.document}`);
                      } else if (notif.workspace) {
                        navigate(`/workspace/${notif.workspace}`);
                      } else {
                        navigate("/notifications");
                      }
                    }}
                    className={`p-3 flex items-start gap-2.5 hover:bg-stone-50 transition cursor-pointer ${
                      !notif.read ? "bg-violet-50/30" : ""
                    }`}
                  >
                    <Avatar
                      name={notif.actor?.name || "System"}
                      src={notif.actor?.avatar}
                      size="sm"
                    />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-stone-800 leading-snug">
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!notif.read && (
                      <button
                        onClick={(e) => handleMarkAsRead(notif._id, e)}
                        className="p-1 text-stone-400 hover:text-violet-600 rounded cursor-pointer"
                        title="Mark as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                ))}

                {(!notifications || notifications.length === 0) && (
                  <div className="p-6 text-center text-xs text-stone-400 italic">
                    No notifications yet
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-stone-100 bg-stone-50/50 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotificationOpen(false)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center justify-center gap-1"
                >
                  View all notifications <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-stone-200" />

        {/* Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-stone-100 transition duration-150 cursor-pointer"
          >
            <Avatar name={user?.name || "User"} size="sm" />
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-stone-900 leading-tight">
                {user?.name}
              </span>
              <span className="text-[10px] text-stone-400 leading-tight">
                {user?.email}
              </span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-stone-100 mb-1">
                <p className="text-xs font-bold text-stone-900 truncate">{user?.name}</p>
                <p className="text-[10px] text-stone-400 truncate">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition"
              >
                <Settings size={14} className="text-stone-400" />
                Settings
              </Link>
              <button
                type="button"
                onClick={async () => {
                  setProfileOpen(false);
                  try {
                    await api.get("/api/v1/user/logout");
                  } catch (e) {
                    console.error(e);
                  }
                  dispatch({ type: "auth/logoutUser" });
                  navigate("/login");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              >
                <LogOut size={14} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
