import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  ExternalLink,
  MessageSquare,
  FileText,
  UserPlus,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Avatar from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import {
  setNotificationsData,
  markAsReadInState,
  markAllAsReadInState,
  removeNotificationFromState,
  clearAllNotificationsInState,
} from "../../features/notification/notificationSlice";

export const NotificationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { notifications, unreadCount, totalCount, currentPage, totalPages } =
    useSelector((state) => state.notification);

  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const [page, setPage] = useState(1);

  const fetchNotifications = async (targetPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/v1/notification?page=${targetPage}&limit=20`);
      dispatch(setNotificationsData(res));
    } catch (err) {
      toast.error(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
  }, [page]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.patch(`/api/v1/notification/read/${notificationId}`);
      dispatch(markAsReadInState(notificationId));
    } catch (err) {
      toast.error(err.message || "Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/api/v1/notification/read-all");
      dispatch(markAllAsReadInState());
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err.message || "Failed to mark all as read");
    }
  };

  const handleDeleteOne = async (notificationId) => {
    try {
      await api.delete(`/api/v1/notification/${notificationId}`);
      dispatch(removeNotificationFromState(notificationId));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete notification");
    }
  };

  const handleDeleteAll = async () => {
    try {
      await api.delete("/api/v1/notification/all");
      dispatch(clearAllNotificationsInState());
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error(err.message || "Failed to clear notifications");
    }
  };

  // Filter items
  const filteredNotifications = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.read);
    if (filter === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, filter]);

  // Group by date: Today, Yesterday, Earlier
  const groupedNotifications = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    filteredNotifications.forEach((n) => {
      const dateStr = new Date(n.createdAt).toDateString();
      if (dateStr === today) {
        groups.Today.push(n);
      } else if (dateStr === yesterday) {
        groups.Yesterday.push(n);
      } else {
        groups.Earlier.push(n);
      }
    });

    return groups;
  }, [filteredNotifications]);

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title="Notifications"
          breadcrumbs={[{ label: "Notifications" }]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="text-xs bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Mentions, replies, invitations, and updates from your workspaces
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={CheckCheck}
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  className="text-stone-400 hover:text-rose-600"
                  onClick={handleDeleteAll}
                >
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-200">
            <button
              onClick={() => setFilter("all")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                filter === "all"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                filter === "unread"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
                filter === "read"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Read
            </button>
          </div>

          {/* Grouped Notifications List */}
          {filteredNotifications.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([groupName, items]) => {
                if (items.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-2.5">
                    <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                      {groupName}
                    </h3>
                    <div className="space-y-2">
                      {items.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.read) handleMarkAsRead(n._id);
                            if (n.document) {
                              navigate(`/collaboration/${n.document}`);
                            } else if (n.workspace) {
                              navigate(`/workspace/${n.workspace}`);
                            } else if (n.type === "workspace_invite") {
                              navigate("/invitations");
                            }
                          }}
                          className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 text-xs ${
                            !n.read
                              ? "bg-white border-violet-200/80 shadow-xs hover:border-violet-300"
                              : "bg-white/80 border-stone-200/80 hover:bg-stone-50 text-stone-600"
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <Avatar
                              name={n.actor?.name || "System"}
                              src={n.actor?.avatar}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-stone-900 leading-snug font-medium">
                                {n.message}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-stone-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {n.type && (
                                  <span className="capitalize">
                                    {n.type.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!n.read && (
                              <button
                                onClick={() => handleMarkAsRead(n._id)}
                                className="p-1 text-stone-400 hover:text-violet-600 rounded transition"
                                title="Mark as read"
                              >
                                <Check size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteOne(n._id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                              title="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-violet-600 ml-1" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Bell}
              title="No notifications"
              description={
                filter === "unread"
                  ? "You have caught up with all notifications."
                  : "Notifications about mentions, document shares, and invites will appear here."
              }
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
