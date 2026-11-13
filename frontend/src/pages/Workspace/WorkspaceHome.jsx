import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Folder,
  FolderPlus,
  FileText,
  FilePlus,
  Users,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronRight,
  Shield,
  Clock,
  LogOut,
  Settings,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import WorkspaceExplorer from "../../components/explorer/WorkspaceExplorer";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Avatar, { getColorForString } from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import { setSelectedWorkspace, updateWorkspaceInList } from "../../features/workspace/workspaceSlice";
import { setFolders, setSelectedFolder } from "../../features/folder/folderSlice";
import { setDocuments } from "../../features/document/documentSlice";

export const WorkspaceHome = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { selectedWorkspace } = useSelector((state) => state.workspace);
  const { folders, selectedFolder } = useSelector((state) => state.folder);
  const { documents } = useSelector((state) => state.document);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");

  const [createDocModalOpen, setCreateDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");

  const [renameItem, setRenameItem] = useState(null); // { type: "folder" | "doc", item }
  const [renameName, setRenameName] = useState("");

  const [deleteItem, setDeleteItem] = useState(null); // { type: "folder" | "doc", item }
  const [actionBusy, setActionBusy] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);

  // Load workspace, folders, documents
  const loadWorkspaceData = async () => {
    if (!workspaceId) return;
    try {
      const [wsRes, fldRes, docRes] = await Promise.all([
        api.get(`/api/v1/workspace/getWorkspace/${workspaceId}`),
        api.get(`/api/v1/folder/getWorkspaceFolders/${workspaceId}`),
        api.get(`/api/v1/document/getWorkspaceDocuments/${workspaceId}`),
      ]);
      dispatch(setSelectedWorkspace(wsRes.workspace));
      dispatch(setFolders(fldRes.folders || []));
      dispatch(setDocuments(docRes.documents || []));
    } catch (err) {
      toast.error(err.message || "Failed to load workspace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadWorkspaceData();
  }, [workspaceId]);

  // Compute permissions
  const isOwner =
    String(
      selectedWorkspace?.owner?._id ||
        selectedWorkspace?.owner?.id ||
        selectedWorkspace?.owner
    ) === String(user?.id || user?._id);

  const memberRecord = selectedWorkspace?.members?.find(
    (m) =>
      String(m.user?._id || m.user?.id || m.user) ===
      String(user?.id || user?._id)
  );

  const userRole = isOwner ? "owner" : memberRecord?.role || "viewer";
  const canManage = userRole === "owner" || userRole === "editor";

  // Filter items in the current view (root vs inside selected folder)
  const currentFolders = useMemo(() => {
    if (selectedFolder) {
      return folders.filter(
        (f) =>
          String(f.parentFolder?._id || f.parentFolder) ===
          String(selectedFolder._id)
      );
    }
    // Root level folders
    return folders.filter((f) => !f.parentFolder);
  }, [folders, selectedFolder]);

  const currentDocuments = useMemo(() => {
    if (selectedFolder) {
      return documents.filter(
        (d) => String(d.folder?._id || d.folder) === String(selectedFolder._id)
      );
    }
    // Root level documents
    return documents.filter((d) => !d.folder);
  }, [documents, selectedFolder]);

  // Handle invitation
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.post(`/api/v1/invitation/createInvitation/${workspaceId}`, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteModalOpen(false);
      setInviteEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  // Handle Create Folder
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setActionBusy(true);
    try {
      await api.post(`/api/v1/folder/createFolder/${workspaceId}`, {
        name: folderName.trim(),
        parentFolder: selectedFolder?._id || null,
      });
      toast.success("Folder created");
      setCreateFolderModalOpen(false);
      setFolderName("");
      loadWorkspaceData();
    } catch (err) {
      toast.error(err.message || "Failed to create folder");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Create Document
  const handleCreateDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    setActionBusy(true);
    try {
      const res = await api.post(
        `/api/v1/document/createDocument/${workspaceId}`,
        {
          title: docTitle.trim(),
          folderId: selectedFolder?._id || null,
        }
      );
      toast.success("Document created");
      setCreateDocModalOpen(false);
      setDocTitle("");
      loadWorkspaceData();
      if (res.document?._id) {
        navigate(`/collaboration/${res.document._id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create document");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Rename
  const handleRename = async (e) => {
    e.preventDefault();
    if (!renameName.trim() || !renameItem) return;
    setActionBusy(true);
    try {
      if (renameItem.type === "folder") {
        await api.put(`/api/v1/folder/updateFolder/${renameItem.item._id}`, {
          name: renameName.trim(),
        });
        toast.success("Folder renamed");
      } else {
        await api.put(`/api/v1/document/updateDocument/${renameItem.item._id}`, {
          title: renameName.trim(),
        });
        toast.success("Document renamed");
      }
      setRenameItem(null);
      setRenameName("");
      loadWorkspaceData();
    } catch (err) {
      toast.error(err.message || "Rename failed");
    } finally {
      setActionBusy(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deleteItem) return;
    setActionBusy(true);
    try {
      if (deleteItem.type === "folder") {
        await api.delete(`/api/v1/folder/deleteFolder/${deleteItem.item._id}`);
        toast.success("Folder and its contents deleted");
        if (selectedFolder?._id === deleteItem.item._id) {
          dispatch(setSelectedFolder(null));
        }
      } else {
        await api.delete(
          `/api/v1/document/deleteDocument/${deleteItem.item._id}`
        );
        toast.success("Document deleted");
      }
      setDeleteItem(null);
      loadWorkspaceData();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
          Loading workspace...
        </div>
      </div>
    );
  }

  const tagColor = getColorForString(selectedWorkspace?.name || "");
  const initials = selectedWorkspace?.name?.slice(0, 2).toUpperCase() || "WS";

  return (
    <div
      onClick={() => activeMenuId && setActiveMenuId(null)}
      className="flex h-screen w-full bg-stone-50 overflow-hidden"
    >
      {/* 1. Global Persistent Sidebar */}
      <Sidebar />

      {/* 2. Persistent Hierarchical Workspace Explorer */}
      <WorkspaceExplorer
        workspace={selectedWorkspace}
        folders={folders}
        documents={documents}
        activeFolderId={selectedFolder?._id}
        onFolderSelect={(folder) => dispatch(setSelectedFolder(folder))}
        onDocumentSelect={(doc) => navigate(`/collaboration/${doc._id}`)}
        onRefresh={loadWorkspaceData}
      />

      {/* 3. Main Workspace Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title={selectedWorkspace?.name || "Workspace"}
          breadcrumbs={[
            { label: "Workspaces", path: "/workspaces" },
            {
              label: selectedWorkspace?.name,
              path: `/workspace/${selectedWorkspace?._id}`,
            },
            ...(selectedFolder
              ? [{ label: selectedFolder.name }]
              : []),
          ]}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search files in workspace..."
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Workspace Banner Header */}
          <div className="p-6 rounded-2xl border border-stone-200/80 bg-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <span
                className={`w-12 h-12 rounded-xl text-base font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
              >
                {initials}
              </span>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                    {selectedWorkspace?.name}
                  </h1>
                  <Badge variant={userRole} size="sm">
                    {userRole === "owner"
                      ? "Owner"
                      : userRole === "editor"
                      ? "Editor"
                      : "Viewer"}
                  </Badge>
                </div>
                <p className="text-xs text-stone-500 mt-1 max-w-xl leading-relaxed">
                  {selectedWorkspace?.description ||
                    "Collaborative knowledge workspace for documents, notes, and specs."}
                </p>

                {/* Meta details */}
                <div className="flex items-center gap-4 mt-3 text-xs text-stone-400">
                  <div className="flex items-center gap-1.5">
                    <Avatar
                      name={selectedWorkspace?.owner?.name || "Owner"}
                      src={selectedWorkspace?.owner?.avatar}
                      size="xs"
                    />
                    <span>
                      Owned by{" "}
                      <strong className="font-semibold text-stone-700">
                        {selectedWorkspace?.owner?.name || "Owner"}
                      </strong>
                    </span>
                  </div>
                  <span>•</span>
                  <span>{selectedWorkspace?.members?.length || 1} members</span>
                </div>
              </div>
            </div>

            {/* Actions: Members link & Invite Button */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link to={`/workspace/${workspaceId}/members`}>
                <Button variant="outline" size="sm" icon={Users}>
                  Members
                </Button>
              </Link>
              {isOwner && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setInviteModalOpen(true)}
                >
                  Invite members
                </Button>
              )}
            </div>
          </div>

          {/* Current Folder / Location Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-stone-200/60 text-stone-600">
                {selectedFolder ? <Folder size={17} /> : <FileText size={17} />}
              </div>
              <div>
                <div className="flex items-center gap-1 text-sm font-bold text-stone-900">
                  {selectedFolder ? (
                    <>
                      <button
                        onClick={() => dispatch(setSelectedFolder(null))}
                        className="text-stone-400 hover:text-stone-700 cursor-pointer font-medium"
                      >
                        Workspace root
                      </button>
                      <ChevronRight size={14} className="text-stone-300" />
                      <span>{selectedFolder.name}</span>
                    </>
                  ) : (
                    <span>All files (Workspace root)</span>
                  )}
                </div>
                <span className="text-[11px] text-stone-400">
                  {currentFolders.length} folders, {currentDocuments.length} documents
                </span>
              </div>
            </div>

            {/* Actions: New Folder & New Document */}
            {canManage && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={FolderPlus}
                  onClick={() => {
                    setFolderName("");
                    setCreateFolderModalOpen(true);
                  }}
                >
                  New folder
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FilePlus}
                  onClick={() => {
                    setDocTitle("");
                    setCreateDocModalOpen(true);
                  }}
                >
                  New document
                </Button>
              </div>
            )}
          </div>

          {/* Folders & Documents Listing Table */}
          <div className="rounded-xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Name</div>
              <div className="col-span-2 hidden sm:block">Type</div>
              <div className="col-span-3 sm:col-span-3">Last modified</div>
              <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-stone-100">
              {/* Folders */}
              {currentFolders.map((folder) => (
                <div
                  key={folder._id}
                  onClick={() => dispatch(setSelectedFolder(folder))}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-stone-50 transition cursor-pointer group text-xs"
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200/60">
                      <Folder size={15} />
                    </div>
                    <span className="font-semibold text-stone-900 truncate group-hover:text-violet-700 transition">
                      {folder.name}
                    </span>
                  </div>

                  <div className="col-span-2 hidden sm:block text-stone-500 font-medium">
                    Folder
                  </div>

                  <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5 text-stone-400">
                    <Clock size={12} />
                    <span>{new Date(folder.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div
                    className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canManage && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === folder._id ? null : folder._id
                            )
                          }
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuId === folder._id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-stone-200 p-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                dispatch(setSelectedFolder(folder));
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition text-left cursor-pointer"
                            >
                              <ExternalLink size={13} />
                              Open
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setRenameItem({ type: "folder", item: folder });
                                setRenameName(folder.name);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition text-left cursor-pointer"
                            >
                              <Pencil size={13} />
                              Rename
                            </button>
                            <div className="h-px bg-stone-100 my-1" />
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteItem({ type: "folder", item: folder });
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition text-left cursor-pointer font-medium"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Documents */}
              {currentDocuments.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/collaboration/${doc._id}`)}
                  className="grid grid-cols-12 px-4 py-3 items-center hover:bg-stone-50 transition cursor-pointer group text-xs"
                >
                  <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 border border-violet-200/60">
                      <FileText size={15} />
                    </div>
                    <span className="font-semibold text-stone-900 truncate group-hover:text-violet-700 transition">
                      {doc.title}
                    </span>
                  </div>

                  <div className="col-span-2 hidden sm:block text-stone-500 font-medium">
                    <Badge variant={doc.access || "viewer"} size="sm">
                      {doc.access === "owner"
                        ? "Owner"
                        : doc.access === "editor"
                        ? "Editor"
                        : "Viewer"}
                    </Badge>
                  </div>

                  <div className="col-span-3 sm:col-span-3 flex items-center gap-1.5 text-stone-400">
                    <Clock size={12} />
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div
                    className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/collaboration/${doc._id}`)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                      title="Open document"
                    >
                      <ExternalLink size={15} />
                    </button>

                    {canManage && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuId(
                              activeMenuId === doc._id ? null : doc._id
                            )
                          }
                          className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
                        >
                          <MoreVertical size={15} />
                        </button>

                        {activeMenuId === doc._id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-stone-200 p-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setRenameItem({ type: "doc", item: doc });
                                setRenameName(doc.title);
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition text-left cursor-pointer"
                            >
                              <Pencil size={13} />
                              Rename
                            </button>
                            <div className="h-px bg-stone-100 my-1" />
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeleteItem({ type: "doc", item: doc });
                              }}
                              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition text-left cursor-pointer font-medium"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {currentFolders.length === 0 && currentDocuments.length === 0 && (
                <div className="p-10">
                  <EmptyState
                    icon={Folder}
                    title="Folder is empty"
                    description="There are no documents or subfolders in this location yet."
                    actionLabel={canManage ? "New document" : undefined}
                    onAction={() => setCreateDocModalOpen(true)}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Invite Member Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite member to workspace"
        description="Invited members can collaborate according to their assigned role."
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Input
            autoFocus
            label="Email address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            required
          />
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Workspace Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            >
              <option value="editor">Editor (can create and edit folders/docs)</option>
              <option value="viewer">Viewer (read-only workspace access)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={inviting}
              disabled={!inviteEmail.trim()}
            >
              Send invitation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Folder Modal */}
      <Modal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        title="Create new folder"
        description={
          selectedFolder
            ? `Creating inside “${selectedFolder.name}”`
            : "Creating at workspace root"
        }
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            autoFocus
            label="Folder Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="e.g. Sprint 24 Specs"
            required
            maxLength={50}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateFolderModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionBusy}
              disabled={!folderName.trim()}
            >
              Create folder
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Document Modal */}
      <Modal
        isOpen={createDocModalOpen}
        onClose={() => setCreateDocModalOpen(false)}
        title="Create new document"
        description={
          selectedFolder
            ? `Creating inside “${selectedFolder.name}”`
            : "Creating at workspace root"
        }
      >
        <form onSubmit={handleCreateDoc} className="space-y-4">
          <Input
            autoFocus
            label="Document Title"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="e.g. Design Guidelines"
            required
            maxLength={100}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateDocModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionBusy}
              disabled={!docTitle.trim()}
            >
              Create document
            </Button>
          </div>
        </form>
      </Modal>

      {/* Rename Modal */}
      <Modal
        isOpen={Boolean(renameItem)}
        onClose={() => setRenameItem(null)}
        title={renameItem?.type === "folder" ? "Rename folder" : "Rename document"}
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            autoFocus
            label="Name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            required
            maxLength={renameItem?.type === "folder" ? 50 : 100}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenameItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionBusy}
            >
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        title={`Delete ${deleteItem?.type === "folder" ? "folder" : "document"}?`}
        description={
          deleteItem?.type === "folder"
            ? `“${deleteItem?.item?.name}” and all nested folders and documents will be permanently removed.`
            : `“${deleteItem?.item?.title}” will be permanently deleted.`
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteItem(null)}
          >
            Keep
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actionBusy}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceHome;
