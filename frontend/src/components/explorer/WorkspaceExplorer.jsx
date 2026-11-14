import React, { useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  FilePlus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  LayoutDashboard,
  Activity as ActivityIcon,
  ChevronsUpDown,
} from "lucide-react";
import { setSelectedFolder } from "../../features/folder/folderSlice";
import { setSelectedDocument } from "../../features/document/documentSlice";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Button from "../common/Button";
import api from "../../services/api";
import { useToast } from "../common/Toast";

export const WorkspaceExplorer = ({
  workspace,
  folders = [],
  documents = [],
  activeDocumentId,
  activeFolderId,
  onFolderSelect,
  onDocumentSelect,
  onRefresh,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);

  // Check user role in this workspace
  const userMemberRecord = workspace?.members?.find(
    (m) => String(m.user?._id || m.user?.id || m.user) === String(user?.id || user?._id)
  );
  const userRole =
    String(workspace?.owner?._id || workspace?.owner?.id || workspace?.owner) ===
    String(user?.id || user?._id)
      ? "owner"
      : userMemberRecord?.role || "viewer";

  const canManage = userRole === "owner" || userRole === "editor";

  // Expanded folders state (by folder ID)
  const [expandedFolders, setExpandedFolders] = useState({});

  // Context menu state: { type: "folder" | "document", item, x, y }
  const [contextMenu, setContextMenu] = useState(null);

  // Modals state
  const [modalType, setModalType] = useState(null); // "createFolder" | "createDocument" | "renameFolder" | "renameDocument" | "deleteConfirm"
  const [targetItem, setTargetItem] = useState(null);
  const [formName, setFormName] = useState("");
  const [selectedParentFolder, setSelectedParentFolder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleFolder = (folderId, e) => {
    e?.stopPropagation();
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  // Build recursive folder hierarchy tree
  const folderTree = useMemo(() => {
    const map = {};
    const roots = [];

    // Initialize map
    folders.forEach((folder) => {
      map[folder._id] = { ...folder, children: [], docs: [] };
    });

    // Populate documents inside their respective folder
    documents.forEach((doc) => {
      const folderId = doc.folder?._id || doc.folder;
      if (folderId && map[folderId]) {
        map[folderId].docs.push(doc);
      }
    });

    // Structure folder hierarchy
    folders.forEach((folder) => {
      const parentId = folder.parentFolder?._id || folder.parentFolder;
      if (parentId && map[parentId]) {
        map[parentId].children.push(map[folder._id]);
      } else {
        roots.push(map[folder._id]);
      }
    });

    return roots;
  }, [folders, documents]);

  // Root-level documents (not inside any folder)
  const rootDocuments = useMemo(() => {
    return documents.filter((doc) => !doc.folder);
  }, [documents]);

  const handleContextMenu = (e, type, item) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type,
      item,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 200),
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  // Operations
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/folder/createFolder/${workspace._id}`, {
        name: formName.trim(),
        parentFolder: selectedParentFolder || null,
      });
      toast.success("Folder created");
      setModalType(null);
      setFormName("");
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "Failed to create folder");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/v1/document/createDocument/${workspace._id}`, {
        title: formName.trim(),
        folderId: selectedParentFolder || null,
      });
      toast.success("Document created");
      setModalType(null);
      setFormName("");
      onRefresh?.();
      if (res.document?._id) {
        navigate(`/collaboration/${res.document._id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create document");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !targetItem) return;
    setSubmitting(true);
    try {
      if (modalType === "renameFolder") {
        await api.put(`/api/v1/folder/updateFolder/${targetItem._id}`, {
          name: formName.trim(),
        });
        toast.success("Folder renamed");
      } else {
        await api.put(`/api/v1/document/updateDocument/${targetItem._id}`, {
          title: formName.trim(),
        });
        toast.success("Document renamed");
      }
      setModalType(null);
      setFormName("");
      setTargetItem(null);
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "Rename failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!targetItem) return;
    setSubmitting(true);
    try {
      if (targetItem.type === "folder") {
        await api.delete(`/api/v1/folder/deleteFolder/${targetItem._id}`);
        toast.success("Folder and contents deleted");
        if (activeFolderId === targetItem._id) {
          navigate(`/workspace/${workspace._id}`);
        }
      } else {
        await api.delete(`/api/v1/document/deleteDocument/${targetItem._id}`);
        toast.success("Document deleted");
        if (activeDocumentId === targetItem._id) {
          navigate(`/workspace/${workspace._id}`);
        }
      }
      setModalType(null);
      setTargetItem(null);
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Render a folder node recursively
  const renderFolder = (folder, depth = 0) => {
    const isExpanded = expandedFolders[folder._id];
    const isSelected = activeFolderId === folder._id;

    return (
      <div key={folder._id} className="select-none text-xs">
        {/* Folder row */}
        <div
          onClick={() => {
            toggleFolder(folder._id);
            onFolderSelect?.(folder);
          }}
          onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
          className={`flex items-center justify-between group px-2 py-1.5 rounded-lg transition-colors cursor-pointer ${
            isSelected
              ? "bg-violet-100/70 text-violet-900 font-semibold"
              : "hover:bg-stone-100 text-stone-700"
          }`}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              onClick={(e) => toggleFolder(folder._id, e)}
              className="text-stone-400 hover:text-stone-700 p-0.5 rounded cursor-pointer"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
            {isExpanded ? (
              <FolderOpen size={15} className="text-violet-600 shrink-0" />
            ) : (
              <Folder size={15} className="text-stone-400 shrink-0" />
            )}
            <span className="truncate">{folder.name}</span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={(e) => handleContextMenu(e, "folder", folder)}
              className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer transition"
            >
              <MoreVertical size={13} />
            </button>
          )}
        </div>

        {/* Children (subfolders and documents inside this folder) */}
        {isExpanded && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
            {folder.docs.map((doc) => renderDocument(doc, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render a document node
  const renderDocument = (doc, depth = 0) => {
    const isSelected = activeDocumentId === doc._id;

    return (
      <div
        key={doc._id}
        onClick={() => {
          onDocumentSelect?.(doc);
          navigate(`/collaboration/${doc._id}`);
        }}
        onContextMenu={(e) => handleContextMenu(e, "document", doc)}
        className={`relative flex items-center justify-between group px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer select-none ${
          isSelected
            ? "bg-violet-50/90 dark:bg-violet-950/40 text-violet-950 dark:text-violet-200 font-semibold border border-violet-200/70 dark:border-violet-800/50 shadow-2xs"
            : "hover:bg-stone-100/80 dark:hover:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 border border-transparent"
        }`}
        style={{ paddingLeft: `${depth * 14 + 22}px` }}
      >
        {/* Subtle slim accent indicator on the left for selected item */}
        {isSelected && (
          <span className="absolute left-1 top-1.5 bottom-1.5 w-0.5 rounded-full bg-violet-600 dark:bg-violet-400" />
        )}

        <div className="flex items-center gap-2 min-w-0">
          <FileText
            size={14}
            className={
              isSelected
                ? "text-violet-600 dark:text-violet-400 shrink-0"
                : "text-stone-400 dark:text-stone-500 shrink-0"
            }
          />
          <span className="truncate">{doc.title}</span>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={(e) => handleContextMenu(e, "document", doc)}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded cursor-pointer transition ${
              isSelected
                ? "text-violet-600 dark:text-violet-300 hover:bg-violet-100/60 dark:hover:bg-violet-900/60"
                : "text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-700/60"
            }`}
          >
            <MoreVertical size={13} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={closeContextMenu}
      className="w-64 h-screen bg-white dark:bg-stone-900 border-r border-stone-200 dark:border-stone-800 flex flex-col shrink-0 overflow-hidden select-none"
    >
      {/* Workspace Header / Dropdown */}
      <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
        <Link
          to={`/workspace/${workspace?._id}`}
          className="flex items-center gap-2 min-w-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800">
            {workspace?.name?.slice(0, 2).toUpperCase() || "WS"}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">
              {workspace?.name || "Workspace"}
            </span>
            <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
              {userRole === "owner" ? "Owner" : userRole === "editor" ? "Editor" : "Viewer"} ·{" "}
              {workspace?.members?.length || 1} members
            </span>
          </div>
        </Link>
      </div>

      {/* Workspace Navigation Subtabs */}
      <div className="px-3 pt-2.5 pb-1 border-b border-stone-100 dark:border-stone-800 space-y-0.5">
        <Link
          to={`/workspace/${workspace?._id}`}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            location.pathname === `/workspace/${workspace?._id}`
              ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <LayoutDashboard size={14} className="text-stone-400" />
          <span>Overview</span>
        </Link>
        <Link
          to={`/workspace/${workspace?._id}/members`}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            location.pathname === `/workspace/${workspace?._id}/members`
              ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-stone-400" />
            <span>Members</span>
          </div>
          <span className="text-[10px] bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 px-1.5 py-0.2 rounded font-semibold">
            {workspace?.members?.length || 1}
          </span>
        </Link>
        <Link
          to={`/workspace/${workspace?._id}/activity`}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            location.pathname === `/workspace/${workspace?._id}/activity`
              ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 font-semibold"
              : "text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:text-stone-900 dark:hover:text-stone-200"
          }`}
        >
          <ActivityIcon size={14} className="text-stone-400" />
          <span>Activity</span>
        </Link>
      </div>

      {/* Explorer Tree Header */}
      <div className="px-3 py-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100/50 dark:border-stone-800/50">
        <span>Explorer</span>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setSelectedParentFolder(null);
                setFormName("");
                setModalType("createFolder");
              }}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer"
              title="New folder in root"
            >
              <FolderPlus size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedParentFolder(null);
                setFormName("");
                setModalType("createDocument");
              }}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded cursor-pointer"
              title="New document in root"
            >
              <FilePlus size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Explorer Tree Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {/* Render nested folders */}
        {folderTree.map((folder) => renderFolder(folder, 0))}

        {/* Render root documents */}
        {rootDocuments.map((doc) => renderDocument(doc, 0))}

        {folderTree.length === 0 && rootDocuments.length === 0 && (
          <div className="p-4 text-center text-xs text-stone-400 italic">
            Workspace is empty. Create a folder or document to start.
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="px-3 py-2 border-t border-stone-100 dark:border-stone-800 text-[10px] text-stone-400 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50 font-medium">
        <span>{folders.length} folders</span>
        <span>{documents.length} documents</span>
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-stone-900 rounded-xl shadow-xl border border-stone-200 dark:border-stone-800 p-1 z-50 min-w-44 animate-in fade-in zoom-in-95 duration-100 text-xs"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {contextMenu.type === "folder" ? (
            <>
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setSelectedParentFolder(contextMenu.item._id);
                      setFormName("");
                      setModalType("createDocument");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition cursor-pointer text-left"
                  >
                    <FilePlus size={14} className="text-stone-400" />
                    New document inside
                  </button>
                  <button
                    onClick={() => {
                      setSelectedParentFolder(contextMenu.item._id);
                      setFormName("");
                      setModalType("createFolder");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer text-left"
                  >
                    <FolderPlus size={14} className="text-stone-400" />
                    New subfolder
                  </button>
                  <div className="h-px bg-stone-100 my-1" />
                  <button
                    onClick={() => {
                      setTargetItem(contextMenu.item);
                      setFormName(contextMenu.item.name);
                      setModalType("renameFolder");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer text-left"
                  >
                    <Pencil size={14} className="text-stone-400" />
                    Rename folder
                  </button>
                  <button
                    onClick={() => {
                      setTargetItem({ ...contextMenu.item, type: "folder" });
                      setModalType("deleteConfirm");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer text-left font-medium"
                  >
                    <Trash2 size={14} />
                    Delete folder
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  navigate(`/collaboration/${contextMenu.item._id}`);
                  closeContextMenu();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer text-left"
              >
                <FileText size={14} className="text-stone-400" />
                Open document
              </button>
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setTargetItem(contextMenu.item);
                      setFormName(contextMenu.item.title);
                      setModalType("renameDocument");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer text-left"
                  >
                    <Pencil size={14} className="text-stone-400" />
                    Rename document
                  </button>
                  <div className="h-px bg-stone-100 my-1" />
                  <button
                    onClick={() => {
                      setTargetItem({ ...contextMenu.item, type: "document" });
                      setModalType("deleteConfirm");
                      closeContextMenu();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer text-left font-medium"
                  >
                    <Trash2 size={14} />
                    Delete document
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Create / Rename / Delete Modals */}
      <Modal
        isOpen={modalType === "createFolder"}
        onClose={() => setModalType(null)}
        title="Create new folder"
        description={
          selectedParentFolder
            ? "Creating folder inside selected parent"
            : "Creating folder at workspace root"
        }
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <Input
            autoFocus
            label="Folder Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Backend Architecture"
            required
            maxLength={50}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Create folder
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalType === "createDocument"}
        onClose={() => setModalType(null)}
        title="Create new document"
        description={
          selectedParentFolder
            ? "Creating document inside folder"
            : "Creating document at workspace root"
        }
      >
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <Input
            autoFocus
            label="Document Title"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. API Specification"
            required
            maxLength={100}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Create document
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalType === "renameFolder" || modalType === "renameDocument"}
        onClose={() => setModalType(null)}
        title={modalType === "renameFolder" ? "Rename folder" : "Rename document"}
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            autoFocus
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            maxLength={modalType === "renameFolder" ? 50 : 100}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" loading={submitting}>
              Save changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalType === "deleteConfirm"}
        onClose={() => setModalType(null)}
        title={`Delete ${targetItem?.type === "folder" ? "folder" : "document"}?`}
        description={
          targetItem?.type === "folder"
            ? `“${targetItem?.name}” and all of its nested subfolders and documents will be permanently removed.`
            : `“${targetItem?.title}” will be permanently deleted.`
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setModalType(null)}>
            Keep
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={submitting}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceExplorer;
