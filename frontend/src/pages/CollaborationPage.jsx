import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  MessageSquare,
  Share2,
  Check,
  Clock,
  ChevronRight,
  Shield,
  ArrowLeft,
  MoreVertical,
  Trash2,
} from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import WorkspaceExplorer from "../components/explorer/WorkspaceExplorer";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";
import CommentsPanel from "../components/comments/CommentsPanel";
import CollaboratorsPanel from "../components/collaborators/CollaboratorsPanel";
import Avatar from "../components/common/Avatar";
import Badge from "../components/common/Badge";
import Button from "../components/common/Button";
import Modal from "../components/common/Modal";
import api from "../services/api";
import { useToast } from "../components/common/Toast";
import { setSelectedDocument, setDocuments } from "../features/document/documentSlice";
import { setSelectedWorkspace } from "../features/workspace/workspaceSlice";
import { setFolders } from "../features/folder/folderSlice";
import { setComments } from "../features/comment/commentSlice";
import { setCollaborators } from "../features/collaborator/collaboratorSlice";

export const CollaborationPage = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { selectedDocument } = useSelector((state) => state.document);
  const { selectedWorkspace } = useSelector((state) => state.workspace);
  const { folders } = useSelector((state) => state.folder);
  const { documents } = useSelector((state) => state.document);
  const { comments } = useSelector((state) => state.comment);

  const [loading, setLoading] = useState(true);
  const [docAccess, setDocAccess] = useState("viewer");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [activeSidePanel, setActiveSidePanel] = useState("comments"); // "comments" | "collaborators" | null
  const [selectedTextRange, setSelectedTextRange] = useState(null);

  const [docTitle, setDocTitle] = useState("");
  const [isRenamingTitle, setIsRenamingTitle] = useState(false);
  const [deleteDocModalOpen, setDeleteDocModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const debounceTimerRef = useRef(null);

  // Load document, workspace, folders, comments, collaborators
  const loadDocumentData = useCallback(async () => {
    if (!documentId) return;
    try {
      // 1. Fetch document
      const docRes = await api.get(`/api/v1/document/getDocument/${documentId}`);
      dispatch(setSelectedDocument(docRes.document));
      setDocAccess(docRes.access || "viewer");
      setDocTitle(docRes.document.title || "Untitled Document");

      const wsId = docRes.document.workspace?._id || docRes.document.workspace;

      // 2. Fetch workspace, folders, workspace docs, comments, collaborators in parallel
      const [wsRes, fldRes, wsDocsRes, cmtRes, colRes] = await Promise.all([
        api.get(`/api/v1/workspace/getWorkspace/${wsId}`).catch(() => null),
        api.get(`/api/v1/folder/getWorkspaceFolders/${wsId}`).catch(() => ({ folders: [] })),
        api.get(`/api/v1/document/getWorkspaceDocuments/${wsId}`).catch(() => ({ documents: [] })),
        api.get(`/api/v1/comment/${documentId}`).catch(() => ({ comments: [] })),
        api.get(`/api/v1/document/getCollaborators/${documentId}`).catch(() => ({ collaborators: [] })),
      ]);

      if (wsRes?.workspace) dispatch(setSelectedWorkspace(wsRes.workspace));
      dispatch(setFolders(fldRes?.folders || []));
      dispatch(setDocuments(wsDocsRes?.documents || []));
      dispatch(setComments(cmtRes?.comments || []));
      dispatch(setCollaborators(colRes?.collaborators || []));
    } catch (err) {
      toast.error(err.message || "Failed to open document");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [documentId, dispatch, navigate, toast]);

  useEffect(() => {
    setLoading(true);
    loadDocumentData();
  }, [documentId, loadDocumentData]);

  // Handle live title updates
  const handleTitleChange = (newTitle) => {
    setDocTitle(newTitle);
    setSaveStatus("saving");

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await api.put(`/api/v1/document/updateDocument/${documentId}`, {
          title: newTitle.trim(),
        });
        setSaveStatus("saved");
      } catch (e) {
        setSaveStatus("saved");
      }
    }, 600);
  };

  // Handle Delete Document
  const handleDeleteDoc = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/v1/document/deleteDocument/${documentId}`);
      toast.success("Document deleted");
      const wsId =
        selectedDocument?.workspace?._id || selectedDocument?.workspace;
      navigate(`/workspace/${wsId}`);
    } catch (err) {
      toast.error(err.message || "Failed to delete document");
    } finally {
      setDeleting(false);
      setDeleteDocModalOpen(false);
    }
  };

  const isDocOwner = docAccess === "owner";
  const canEdit = docAccess === "owner" || docAccess === "editor";

  // Find parent folder name if document is inside a folder
  const parentFolder = folders.find(
    (f) =>
      String(f._id) ===
      String(selectedDocument?.folder?._id || selectedDocument?.folder)
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
          Loading document and collaboration room...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      {/* 1. Global Sidebar */}
      <Sidebar isCollapsed={true} />

      {/* 2. Persistent Hierarchical Workspace Explorer */}
      <WorkspaceExplorer
        workspace={selectedWorkspace}
        folders={folders}
        documents={documents}
        activeDocumentId={documentId}
        onDocumentSelect={(doc) => navigate(`/collaboration/${doc._id}`)}
        onRefresh={loadDocumentData}
      />

      {/* 3. Main Document Editor Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {/* Top Header Bar for Document */}
        <header className="h-14 border-b border-stone-200 px-6 flex items-center justify-between shrink-0 bg-white z-20">
          {/* Left: Breadcrumbs & Live Document Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/workspace/${selectedWorkspace?._id}`}
              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Back to workspace"
            >
              <ArrowLeft size={16} />
            </Link>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 font-medium truncate">
                <Link
                  to={`/workspace/${selectedWorkspace?._id}`}
                  className="hover:text-stone-700 transition"
                >
                  {selectedWorkspace?.name}
                </Link>
                {parentFolder && (
                  <>
                    <span>/</span>
                    <span className="truncate">{parentFolder.name}</span>
                  </>
                )}
                <span>/</span>
                {/* Save status badge */}
                <span className="flex items-center gap-1 text-[10px] text-stone-400 font-normal">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      saveStatus === "saving"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-emerald-500"
                    }`}
                  />
                  {saveStatus === "saving" ? "Saving..." : "Saved"}
                </span>
              </div>

              {/* Title input or label */}
              {canEdit ? (
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Document title"
                  maxLength={100}
                  className="text-sm font-bold text-stone-900 bg-transparent border-0 p-0 focus:outline-none focus:ring-0 truncate max-w-sm sm:max-w-md"
                />
              ) : (
                <span className="text-sm font-bold text-stone-900 truncate max-w-sm sm:max-w-md">
                  {docTitle}
                </span>
              )}
            </div>
          </div>

          {/* Right: Presence Avatars, Collaborators, Comments Toggle */}
          <div className="flex items-center gap-2.5">
            {/* Live Online Users Cluster */}
            <div className="flex items-center -space-x-1.5 mr-1" title="Online collaborators">
              {onlineUsers.map((u, idx) => (
                <Avatar
                  key={idx}
                  name={u.name}
                  size="xs"
                  isOnline={true}
                  className="ring-2 ring-white"
                  title={`${u.name} (Online)`}
                />
              ))}
            </div>

            {/* Access Badge */}
            <Badge variant={docAccess} size="sm">
              {docAccess === "owner"
                ? "Owner"
                : docAccess === "editor"
                ? "Editor"
                : "Viewer"}
            </Badge>

            {/* Manage Collaborators button */}
            <Button
              variant={activeSidePanel === "collaborators" ? "primary" : "outline"}
              size="sm"
              icon={Share2}
              onClick={() =>
                setActiveSidePanel(
                  activeSidePanel === "collaborators" ? null : "collaborators"
                )
              }
            >
              Share
            </Button>

            {/* Comments Toggle Button */}
            <Button
              variant={activeSidePanel === "comments" ? "primary" : "outline"}
              size="sm"
              icon={MessageSquare}
              onClick={() =>
                setActiveSidePanel(
                  activeSidePanel === "comments" ? null : "comments"
                )
              }
            >
              Comments
              {comments.length > 0 && (
                <span
                  className={`text-[10px] ml-1 px-1.5 py-0.2 rounded-full font-bold ${
                    activeSidePanel === "comments"
                      ? "bg-white text-violet-700"
                      : "bg-violet-100 text-violet-700"
                  }`}
                >
                  {comments.length}
                </span>
              )}
            </Button>

            {/* Delete button (Owner only) */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setDeleteDocModalOpen(true)}
                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                title="Delete document"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </header>

        {/* 4. Real-time Editor Area */}
        <div className="flex-1 flex overflow-hidden">
          <CollaborativeEditor
            documentId={documentId}
            user={user}
            onAccessChange={(newAccess) => setDocAccess(newAccess)}
            onOnlineUsersChange={(users) => setOnlineUsers(users)}
            onSaveStatusChange={(status) => setSaveStatus(status)}
            onTextSelectionChange={(range) => setSelectedTextRange(range)}
            readOnly={!canEdit}
          />

          {/* Right-Side Dock: Comments Panel */}
          {activeSidePanel === "comments" && (
            <CommentsPanel
              documentId={documentId}
              documentAccess={docAccess}
              selectedTextRange={selectedTextRange}
              onClearSelection={() => setSelectedTextRange(null)}
              onClose={() => setActiveSidePanel(null)}
            />
          )}

          {/* Right-Side Dock: Collaborators Panel */}
          {activeSidePanel === "collaborators" && (
            <CollaboratorsPanel
              document={selectedDocument}
              workspace={selectedWorkspace}
              documentAccess={docAccess}
              onClose={() => setActiveSidePanel(null)}
              onRefresh={loadDocumentData}
            />
          )}
        </div>
      </div>

      {/* Delete Document Confirmation Modal */}
      <Modal
        isOpen={deleteDocModalOpen}
        onClose={() => setDeleteDocModalOpen(false)}
        title="Delete document?"
        description={`“${docTitle}” will be permanently deleted along with all its comments and activity history.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDocModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={handleDeleteDoc}
          >
            Delete document
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default CollaborationPage;
