import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Layers,
  FileText,
  Mail,
  Plus,
  Clock,
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  LogOut,
  Folder,
  ArrowRight,
  Activity as ActivityIcon,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Avatar, { getColorForString } from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import EmptyState from "../../components/common/EmptyState";
import { CardSkeleton } from "../../components/common/Skeleton";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import {
  setWorkspaces,
  addWorkspace,
  updateWorkspaceInList,
  removeWorkspaceFromList,
} from "../../features/workspace/workspaceSlice";
import { setMyInvitations } from "../../features/invitation/invitationSlice";

export const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { workspaces } = useSelector((state) => state.workspace);
  const { myInvitations } = useSelector((state) => state.invitation);

  const [loading, setLoading] = useState(true);
  const [recentDocs, setRecentDocs] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState("");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editModalWorkspace, setEditModalWorkspace] = useState(null);
  const [editWsName, setEditWsName] = useState("");
  const [editWsDesc, setEditWsDesc] = useState("");

  const [deleteModalWorkspace, setDeleteModalWorkspace] = useState(null);
  const [leaveModalWorkspace, setLeaveModalWorkspace] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  // Fetch initial dashboard data
  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [wsRes, invRes] = await Promise.all([
          api.get("/api/v1/workspace/getMyWorkspaces"),
          api.get("/api/v1/invitation/getMyInvitations"),
        ]);

        if (isMounted) {
          dispatch(setWorkspaces(wsRes.workspaces || []));
          dispatch(setMyInvitations(invRes.invitations || []));

          // Fetch documents and activities from first 3 workspaces for preview
          const wsList = wsRes.workspaces || [];
          if (wsList.length > 0) {
            const firstWs = wsList[0];

            // Fetch docs for first workspace
            const docsRes = await api
              .get(`/api/v1/document/getWorkspaceDocuments/${firstWs._id}`)
              .catch(() => ({ documents: [] }));

            // Fetch activity for first workspace
            const actRes = await api
              .get(`/api/v1/activity/${firstWs._id}?limit=6`)
              .catch(() => ({ activities: [] }));

            if (isMounted) {
              setRecentDocs(
                (docsRes.documents || []).map((d) => ({
                  ...d,
                  workspaceName: firstWs.name,
                }))
              );
              setRecentActivities(actRes.activities || []);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  // Handle Workspace creation
  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post("/api/v1/workspace/createWorkspace", {
        name: newWsName.trim(),
        description: newWsDesc.trim(),
      });
      dispatch(addWorkspace(res.workspace));
      toast.success("Workspace created successfully");
      setCreateModalOpen(false);
      setNewWsName("");
      setNewWsDesc("");
      navigate(`/workspace/${res.workspace._id}`);
    } catch (err) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Workspace
  const handleEditWorkspace = async (e) => {
    e.preventDefault();
    if (!editWsName.trim() || !editModalWorkspace) return;

    setActionBusy(true);
    try {
      const res = await api.put(
        `/api/v1/workspace/updateWorkspace/${editModalWorkspace._id}`,
        {
          name: editWsName.trim(),
          description: editWsDesc.trim(),
        }
      );
      dispatch(updateWorkspaceInList(res.workspace));
      toast.success("Workspace updated");
      setEditModalWorkspace(null);
    } catch (err) {
      toast.error(err.message || "Failed to update workspace");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Delete Workspace
  const handleDeleteWorkspace = async () => {
    if (!deleteModalWorkspace) return;
    setActionBusy(true);
    try {
      await api.delete(
        `/api/v1/workspace/deleteWorkspace/${deleteModalWorkspace._id}`
      );
      dispatch(removeWorkspaceFromList(deleteModalWorkspace._id));
      toast.success("Workspace and all associated data deleted");
      setDeleteModalWorkspace(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete workspace");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Leave Workspace
  const handleLeaveWorkspace = async () => {
    if (!leaveModalWorkspace) return;
    setActionBusy(true);
    try {
      await api.delete(
        `/api/v1/workspace/leaveWorkspace/${leaveModalWorkspace._id}`
      );
      dispatch(removeWorkspaceFromList(leaveModalWorkspace._id));
      toast.success("You left the workspace");
      setLeaveModalWorkspace(null);
    } catch (err) {
      toast.error(err.message || "Failed to leave workspace");
    } finally {
      setActionBusy(false);
    }
  };

  // Greeting by hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  }, []);

  // Filter workspaces by search
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    const q = searchQuery.toLowerCase();
    return workspaces.filter(
      (ws) =>
        ws.name?.toLowerCase().includes(q) ||
        ws.description?.toLowerCase().includes(q)
    );
  }, [workspaces, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar
          title="Dashboard"
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider block mb-0.5">
                {todayFormatted}
              </span>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                {greeting}, {user?.name?.split(" ")[0] || "there"}
              </h1>
              <p className="text-xs text-stone-500 mt-1">
                Pick up where you left off, or start something new with your team.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setNewWsName("");
                setNewWsDesc("");
                setCreateModalOpen(true);
              }}
            >
              Create workspace
            </Button>
          </div>

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 border border-violet-200/60">
                <Layers size={20} />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block">
                  Workspaces
                </span>
                <span className="text-xl font-bold text-stone-900 leading-tight">
                  {workspaces?.length || 0}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 border border-sky-200/60">
                <FileText size={20} />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block">
                  Recent documents
                </span>
                <span className="text-xl font-bold text-stone-900 leading-tight">
                  {recentDocs.length}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200/60">
                <Mail size={20} />
              </div>
              <div>
                <span className="text-xs font-medium text-stone-500 block">
                  Pending invitations
                </span>
                <span className="text-xl font-bold text-stone-900 leading-tight">
                  {myInvitations?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Section: My Recent Workspaces */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                  My recent workspaces
                </h2>
                <p className="text-xs text-stone-500">
                  Spaces you own or collaborate in
                </p>
              </div>
              <Link
                to="/workspaces"
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition"
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : filteredWorkspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkspaces.slice(0, 6).map((ws) => {
                  const isOwner =
                    String(ws.owner?._id || ws.owner?.id || ws.owner) ===
                    String(user?.id || user?._id);
                  const memberRecord = ws.members?.find(
                    (m) =>
                      String(m.user?._id || m.user?.id || m.user) ===
                      String(user?.id || user?._id)
                  );
                  const userRole = isOwner
                    ? "owner"
                    : memberRecord?.role || "viewer";

                  const tagColor = getColorForString(ws.name);
                  const initials = ws.name.slice(0, 2).toUpperCase();

                  return (
                    <div
                      key={ws._id}
                      onClick={() => navigate(`/workspace/${ws._id}`)}
                      className="group relative p-4 rounded-xl border border-stone-200/80 bg-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-500/5 transition duration-150 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Card top */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
                            >
                              {initials}
                            </span>
                            <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-violet-700 transition">
                              {ws.name}
                            </h3>
                          </div>

                          {/* Context menu toggle */}
                          <div
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === ws._id ? null : ws._id
                                )
                              }
                              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {activeMenuId === ws._id && (
                              <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-stone-200 p-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    navigate(`/workspace/${ws._id}`);
                                  }}
                                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition text-left cursor-pointer"
                                >
                                  <ExternalLink size={13} />
                                  Open
                                </button>
                                {isOwner ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setEditModalWorkspace(ws);
                                        setEditWsName(ws.name);
                                        setEditWsDesc(ws.description || "");
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition text-left cursor-pointer"
                                    >
                                      <Pencil size={13} />
                                      Edit
                                    </button>
                                    <div className="h-px bg-stone-100 my-1" />
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        setDeleteModalWorkspace(ws);
                                      }}
                                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition text-left cursor-pointer font-medium"
                                    >
                                      <Trash2 size={13} />
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setLeaveModalWorkspace(ws);
                                    }}
                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition text-left cursor-pointer font-medium"
                                  >
                                    <LogOut size={13} />
                                    Leave
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-4">
                          {ws.description || "No description provided."}
                        </p>
                      </div>

                      {/* Card Bottom Meta */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        {/* Member avatar stack */}
                        <div className="flex items-center -space-x-1.5">
                          {ws.members?.slice(0, 3).map((m, idx) => (
                            <Avatar
                              key={idx}
                              name={m.user?.name || "Member"}
                              src={m.user?.avatar}
                              size="xs"
                              className="ring-2 ring-white"
                            />
                          ))}
                          {(ws.members?.length || 0) > 3 && (
                            <span className="text-[10px] text-stone-400 font-bold pl-2.5">
                              +{ws.members.length - 3}
                            </span>
                          )}
                        </div>

                        {/* Role Badge */}
                        <Badge variant={userRole} size="sm">
                          {userRole === "owner"
                            ? "Owner"
                            : userRole === "editor"
                            ? "Editor"
                            : "Viewer"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Layers}
                title="No workspaces found"
                description={
                  searchQuery
                    ? `No workspaces match "${searchQuery}".`
                    : "Create your first workspace to collaborate on knowledge, documents, and notes."
                }
                actionLabel={searchQuery ? undefined : "Create workspace"}
                onAction={() => setCreateModalOpen(true)}
              />
            )}
          </section>

          {/* Bottom 2-Column Split: Recently Accessed Documents & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Recently Accessed Documents (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                    Recently accessed documents
                  </h3>
                  <p className="text-xs text-stone-500">
                    Documents you've recently viewed or edited
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs divide-y divide-stone-100">
                {recentDocs.length > 0 ? (
                  recentDocs.slice(0, 5).map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/collaboration/${doc._id}`)}
                      className="p-3.5 flex items-center justify-between hover:bg-stone-50 transition cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 flex items-center justify-center shrink-0 group-hover:bg-violet-100 group-hover:text-violet-700 transition">
                          <FileText size={16} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-stone-900 truncate group-hover:text-violet-700 transition">
                            {doc.title}
                          </span>
                          <span className="text-[10px] text-stone-400 truncate">
                            {doc.workspaceName || "Workspace"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-stone-400 text-[11px] shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(doc.updatedAt).toLocaleDateString()}
                        </span>
                        <Badge variant={doc.access || "viewer"} size="sm">
                          {doc.access || "viewer"}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-stone-400 italic">
                    No documents created yet. Open a workspace to create your first document.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Recent Activity (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900 tracking-tight">
                    Recent activity
                  </h3>
                  <p className="text-xs text-stone-500">
                    Latest changes across your teams
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-2xs space-y-3">
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act) => {
                    let actionDescription = "";
                    if (act.action === "comment_added") {
                      actionDescription = act.metadata?.isReply
                        ? "replied to comment on"
                        : "commented on";
                    } else if (act.action === "member_invited") {
                      actionDescription = "invited a member";
                    } else if (act.action === "member_joined") {
                      actionDescription = "joined workspace";
                    } else if (act.action === "document_created") {
                      actionDescription = "created";
                    } else if (act.action === "document_updated") {
                      actionDescription = "edited";
                    } else if (act.action === "folder_created") {
                      actionDescription = "created";
                    } else {
                      actionDescription = act.action
                        ?.replace(/_/g, " ")
                        ?.toLowerCase();
                    }

                    return (
                      <div
                        key={act._id}
                        className="flex items-start gap-2.5 text-xs pb-3 border-b border-stone-100 dark:border-stone-800 last:border-0 last:pb-0"
                      >
                        <Avatar
                          name={act.user?.name || "User"}
                          src={act.user?.avatar}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-stone-800 dark:text-stone-200 leading-snug">
                            <strong className="font-semibold text-stone-900 dark:text-stone-100">
                              {act.user?.name || "Member"}
                            </strong>{" "}
                            <span className="text-stone-600 dark:text-stone-400">
                              {actionDescription}
                            </span>
                            {act.document?.title && (
                              <span className="text-violet-600 dark:text-violet-400 font-medium">
                                {" "}
                                “{act.document.title}”
                              </span>
                            )}
                            {act.folder?.name && (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">
                                {" "}
                                folder “{act.folder.name}”
                              </span>
                            )}
                          </p>
                          <span className="text-[10px] text-stone-400 mt-0.5 block">
                            {new Date(act.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-xs text-stone-400 italic">
                    No recent activity records yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create new workspace"
        description="A workspace is where your team collaborates on documents and folders."
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            autoFocus
            label="Workspace name"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            placeholder="e.g. Engineering, Design System"
            required
            maxLength={50}
          />
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Description <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={newWsDesc}
              onChange={(e) => setNewWsDesc(e.target.value)}
              placeholder="What will this workspace be used for?"
              rows={3}
              maxLength={200}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={creating}
              disabled={!newWsName.trim()}
            >
              Create workspace
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Workspace Modal */}
      <Modal
        isOpen={Boolean(editModalWorkspace)}
        onClose={() => setEditModalWorkspace(null)}
        title="Edit workspace"
      >
        <form onSubmit={handleEditWorkspace} className="space-y-4">
          <Input
            autoFocus
            label="Workspace name"
            value={editWsName}
            onChange={(e) => setEditWsName(e.target.value)}
            required
            maxLength={50}
          />
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Description
            </label>
            <textarea
              value={editWsDesc}
              onChange={(e) => setEditWsDesc(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalWorkspace(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionBusy}
            >
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Workspace Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteModalWorkspace)}
        onClose={() => setDeleteModalWorkspace(null)}
        title="Delete workspace?"
        description={`“${deleteModalWorkspace?.name}” and all of its nested folders, documents, comments, and activities will be permanently deleted.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalWorkspace(null)}
          >
            Keep
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actionBusy}
            onClick={handleDeleteWorkspace}
          >
            Delete workspace
          </Button>
        </div>
      </Modal>

      {/* Leave Workspace Confirmation Modal */}
      <Modal
        isOpen={Boolean(leaveModalWorkspace)}
        onClose={() => setLeaveModalWorkspace(null)}
        title="Leave workspace?"
        description={`You will lose access to “${leaveModalWorkspace?.name}” and its private documents until invited back.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeaveModalWorkspace(null)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actionBusy}
            onClick={handleLeaveWorkspace}
          >
            Leave workspace
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
