import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Layers,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
  LogOut,
  ExternalLink,
  Users,
  Clock,
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

export const WorkspacesPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { workspaces } = useSelector((state) => state.workspace);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [search, setSearch] = useState("");

  // Modals
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

  useEffect(() => {
    let isMounted = true;
    const fetchWorkspaces = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/v1/workspace/getMyWorkspaces");
        if (isMounted) {
          dispatch(setWorkspaces(res.workspaces || []));
        }
      } catch (err) {
        toast.error(err.message || "Failed to load workspaces");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWorkspaces();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const filteredWorkspaces = useMemo(() => {
    if (!search.trim()) return workspaces;
    const q = search.toLowerCase();
    return workspaces.filter(
      (ws) =>
        ws.name?.toLowerCase().includes(q) ||
        ws.description?.toLowerCase().includes(q)
    );
  }, [workspaces, search]);

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
      toast.success("Workspace created");
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

  const handleDeleteWorkspace = async () => {
    if (!deleteModalWorkspace) return;
    setActionBusy(true);
    try {
      await api.delete(
        `/api/v1/workspace/deleteWorkspace/${deleteModalWorkspace._id}`
      );
      dispatch(removeWorkspaceFromList(deleteModalWorkspace._id));
      toast.success("Workspace and all associated contents deleted");
      setDeleteModalWorkspace(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete workspace");
    } finally {
      setActionBusy(false);
    }
  };

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

  return (
    <div
      onClick={() => activeMenuId && setActiveMenuId(null)}
      className="flex h-screen w-full bg-stone-50 overflow-hidden"
    >
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar
          title="My Workspaces"
          breadcrumbs={[{ label: "Workspaces" }]}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter workspaces..."
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                My Workspaces
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                All the workspaces you own or have been invited to
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Grid / List Switcher */}
              <div className="bg-stone-200/70 p-0.5 rounded-lg flex items-center gap-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-stone-900 font-semibold shadow-2xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid size={15} />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md flex items-center gap-1.5 transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-stone-900 font-semibold shadow-2xs"
                      : "text-stone-500 hover:text-stone-900"
                  }`}
                  title="List view"
                >
                  <ListIcon size={15} />
                  <span className="hidden sm:inline">List</span>
                </button>
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
          </div>

          {/* Workspaces List / Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : filteredWorkspaces.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorkspaces.map((ws) => {
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
                  const ownerName = ws.owner?.name || (isOwner ? "You" : "Unknown");

                  return (
                    <div
                      key={ws._id}
                      onClick={() => navigate(`/workspace/${ws._id}`)}
                      className="group p-5 rounded-xl border border-stone-200/80 bg-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-500/5 transition duration-150 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        {/* Top */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
                            >
                              {initials}
                            </span>
                            <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-violet-700 transition">
                              {ws.name}
                            </h3>
                          </div>

                          {/* 3-dots Menu */}
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
                              <MoreVertical size={16} />
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
                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed mb-3">
                          {ws.description || "No description provided."}
                        </p>

                        {/* Owned by banner */}
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-4">
                          <Avatar
                            name={ownerName}
                            src={ws.owner?.avatar}
                            size="xs"
                          />
                          <span className="truncate">Owned by {ownerName}</span>
                        </div>
                      </div>

                      {/* Bottom row: Members stack + Role pill + Updated */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
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

                        <div className="flex items-center gap-2">
                          <Badge variant={userRole} size="sm">
                            {userRole === "owner"
                              ? "Owner"
                              : userRole === "editor"
                              ? "Editor"
                              : "Viewer"}
                          </Badge>
                          <span className="text-[10px] text-stone-400">
                            {new Date(ws.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* List Table View */
              <div className="rounded-xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs divide-y divide-stone-100">
                {filteredWorkspaces.map((ws) => {
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
                      className="p-4 flex items-center justify-between hover:bg-stone-50 transition cursor-pointer group text-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
                        >
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-stone-900 truncate group-hover:text-violet-700 transition">
                            {ws.name}
                          </h3>
                          <p className="text-stone-400 text-xs truncate max-w-md mt-0.5">
                            {ws.description || "No description"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-1.5 text-stone-500">
                          <Users size={14} className="text-stone-400" />
                          <span>{ws.members?.length || 1} members</span>
                        </div>

                        <Badge variant={userRole} size="sm">
                          {userRole === "owner"
                            ? "Owner"
                            : userRole === "editor"
                            ? "Editor"
                            : "Viewer"}
                        </Badge>

                        <div className="flex items-center gap-1 text-stone-400">
                          <Clock size={13} />
                          <span>{new Date(ws.updatedAt).toLocaleDateString()}</span>
                        </div>

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
                            <MoreVertical size={16} />
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
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState
              icon={Layers}
              title="No workspaces found"
              description={
                search
                  ? `No workspaces match "${search}".`
                  : "You haven't joined or created any workspaces yet."
              }
              actionLabel={search ? undefined : "Create workspace"}
              onAction={() => setCreateModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Create Workspace Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create new workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <Input
            autoFocus
            label="Workspace name"
            value={newWsName}
            onChange={(e) => setNewWsName(e.target.value)}
            placeholder="e.g. Platform Engineering"
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
              placeholder="What is this workspace for?"
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
        description={`“${deleteModalWorkspace?.name}” and all associated documents and folders will be permanently deleted.`}
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
        description={`You will lose access to “${leaveModalWorkspace?.name}” and its private documents.`}
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

export default WorkspacesPage;
