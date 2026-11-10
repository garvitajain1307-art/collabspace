import {
  FileText, Folder, Users, Plus, Search, MoreHorizontal, UserPlus,
  FolderPlus, Clock3, Settings, Trash2, Pencil, X, ChevronDown,
  LayoutDashboard, RefreshCw, LogOut, Mail, Shield, AlertCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import "./WorkspaceHome.css";

import { setSelectedWorkspace, setError } from "../../features/workspace/workspaceSlice";
import { setDocuments } from "../../features/document/documentSlice";
import { setFolders } from "../../features/folder/folderSlice";

const API = import.meta.env.VITE_BACKEND_URL;

const timeAgo = (date) => {
  if (!date) return "—";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(date).toLocaleDateString();
};

const getId = (value) => value && typeof value === "object" ? value._id : value;
const initials = (name = "") => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "?";

const WorkspaceHome = () => {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { selectedWorkspace } = useSelector((state) => state.workspace);
  const { documents = [] } = useSelector((state) => state.document);
  const { folders = [] } = useSelector((state) => state.folder);

  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("Overview");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [modal, setModal] = useState(null);
  const [menu, setMenu] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [inviteError, setInviteError] = useState("");

  const workspace = selectedWorkspace;
  // Owner identity is also compared against the authenticated user when available.
  const currentUser = useSelector((state) => state.auth?.user || state.auth?.userInfo || state.auth?.currentUser);
  const currentUserId = getId(currentUser);
  const ownerId = getId(workspace?.owner);
  const amOwner = Boolean(currentUserId && ownerId && String(currentUserId) === String(ownerId));

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  }, []);

  const loadWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    setPageLoading(true);
    setPageError("");
    try {
      const [workspaceData, documentData, folderData] = await Promise.all([
        request(`/api/v1/workspace/getWorkspace/${workspaceId}`),
        request(`/api/v1/document/getWorkspaceDocuments/${workspaceId}`),
        request(`/api/v1/folder/getWorkspaceFolders/${workspaceId}`)
      ]);
      dispatch(setSelectedWorkspace(workspaceData.workspace));
      dispatch(setDocuments(documentData.documents || []));
      dispatch(setFolders(folderData.folders || []));
    } catch (error) {
      setPageError(error.message || "Unable to load workspace.");
      dispatch(setError(error.message || "Unable to load workspace."));
    } finally {
      setPageLoading(false);
    }
  }, [workspaceId, request, dispatch]);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  useEffect(() => {
    if (!workspace || !amOwner) return;
    request(`/api/v1/invitation/getWorkspaceInvitations/${workspaceId}`)
      .then((data) => setInvitations(data.invitations || []))
      .catch(() => setInvitations([]));
  }, [workspace, workspaceId, amOwner, request]);

  const members = useMemo(() => {
    if (!workspace?.members) return [];
    return workspace.members.map((entry) => ({
      id: getId(entry.user),
      name: entry.user && typeof entry.user === "object" ? entry.user.name : null,
      email: entry.user && typeof entry.user === "object" ? entry.user.email : null,
      role: entry.role || "member"
    }));
  }, [workspace]);

  const visibleFolders = useMemo(() => folders.filter((folder) => {
    const matchesSearch = folder.name?.toLowerCase().includes(search.toLowerCase());
    const matchesKind = kindFilter === "all" || kindFilter === "folders";
    return matchesSearch && matchesKind;
  }), [folders, search, kindFilter]);

  const visibleDocuments = useMemo(() => documents.filter((doc) => {
    const matchesSearch = doc.title?.toLowerCase().includes(search.toLowerCase());
    const matchesKind = kindFilter === "all" || kindFilter === "documents";
    return matchesSearch && matchesKind;
  }), [documents, search, kindFilter]);

  const folderDocumentCount = (folderId) => documents.filter((doc) => String(getId(doc.folder)) === String(folderId)).length;

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setPageError("");
    try {
      await action();
      setModal(null);
      setMenu(null);
      await loadWorkspace();
      if (successMessage) setPageError("");
    } catch (error) {
      setPageError(error.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const openCreateFolder = () => setModal({ type: "folder", title: "Create folder", name: "", parentFolder: "" });
  const openCreateDocument = () => setModal({ type: "document", title: "Create document", name: "", content: "", folderId: "" });
  const openInvite = () => setModal({ type: "invite", title: "Invite a member", email: "", role: "editor" });

  const submitModal = async (event) => {
    event.preventDefault();
    if (!modal) return;
    const value = modal;
    if (value.type === "folder") {
      if (!value.name.trim()) return setPageError("Folder name is required.");
      await runAction(async () => {
        await request(`/api/v1/folder/createFolder/${workspaceId}`, {
          method: "POST", body: JSON.stringify({ name: value.name.trim(), parentFolder: value.parentFolder || null })
        });
      });
    } else if (value.type === "renameFolder") {
      if (!value.name.trim()) return setPageError("Folder name is required.");
      await runAction(async () => {
        await request(`/api/v1/folder/updateFolder/${value.id}`, {
          method: "PUT", body: JSON.stringify({ name: value.name.trim() })
        });
      });
    } else if (value.type === "document") {
      if (!value.name.trim()) return setPageError("Document title is required.");
      await runAction(async () => {
        await request(`/api/v1/document/createDocument/${workspaceId}`, {
          method: "POST", body: JSON.stringify({ title: value.name.trim(), content: value.content || "", folderId: value.folderId || null })
        });
      });
    } else if (value.type === "editDocument") {
      if (!value.name.trim()) return setPageError("Document title is required.");
      await runAction(async () => {
        await request(`/api/v1/document/updateDocument/${value.id}`, {
          method: "PUT", body: JSON.stringify({ title: value.name.trim(), content: value.content, folderId: value.folderId || null })
        });
      });
    } else if (value.type === "invite") {
      if (!value.email.trim()) return setPageError("Email is required.");
      await runAction(async () => {
        await request(`/api/v1/invitation/createInvitation/${workspaceId}`, {
          method: "POST", body: JSON.stringify({ email: value.email.trim(), role: value.role })
        });
        const data = await request(`/api/v1/invitation/getWorkspaceInvitations/${workspaceId}`);
        setInvitations(data.invitations || []);
      });
    } else if (value.type === "settings") {
      if (!value.name.trim()) return setPageError("Workspace name is required.");
      await runAction(async () => {
        const data = await request(`/api/v1/workspace/updateWorkspace/${workspaceId}`, {
          method: "PUT", body: JSON.stringify({ name: value.name.trim(), description: value.description })
        });
        dispatch(setSelectedWorkspace(data.workspace));
      });
    }
  };

  const confirmDeleteFolder = (folder) => setModal({ type: "confirm", title: "Delete folder?", message: `“${folder.name}” and all its nested folders and documents will be permanently deleted.`, confirmLabel: "Delete folder", danger: true, action: async () => request(`/api/v1/folder/deleteFolder/${folder._id}`, { method: "DELETE" }) });
  const confirmDeleteDocument = (doc) => setModal({ type: "confirm", title: "Delete document?", message: `“${doc.title}” will be permanently deleted.`, confirmLabel: "Delete document", danger: true, action: async () => request(`/api/v1/document/deleteDocument/${doc._id}`, { method: "DELETE" }) });
  const confirmCancelInvitation = (invitation) => setModal({ type: "confirm", title: "Cancel invitation?", message: `Cancel the invitation sent to ${invitation.email}?`, confirmLabel: "Cancel invitation", danger: true, action: async () => {
    await request(`/api/v1/invitation/cancelInvitation/${invitation._id}`, { method: "PUT" });
    const data = await request(`/api/v1/invitation/getWorkspaceInvitations/${workspaceId}`);
    setInvitations(data.invitations || []);
  }});
  const confirmRemoveMember = (member) => setModal({ type: "confirm", title: "Remove member?", message: `Remove ${member.email || member.name || member.id} from this workspace?`, confirmLabel: "Remove member", danger: true, action: async () => request(`/api/v1/workspace/deleteMember/${workspaceId}/members/${member.id}`, { method: "DELETE" }) });

  const handleConfirm = async () => {
    if (!modal?.action) return;
    await runAction(() => modal.action());
  };

  const openWorkspaceSettings = () => setModal({
    type: "settings", title: "Workspace settings", name: workspace?.name || "", description: workspace?.description || ""
  });

  if (pageLoading) {
    return <div className="workspace-page"><Sidebar /><main className="workspace-main"><Topbar /><div className="workspace-state">Loading workspace…</div></main></div>;
  }

  if (!workspace) {
    return <div className="workspace-page"><Sidebar /><main className="workspace-main"><Topbar /><div className="workspace-state error-state"><AlertCircle />{pageError || "Workspace not found."}<button onClick={loadWorkspace}>Try again</button></div></main></div>;
  }

  return (
    <div className="workspace-page" onClick={() => menu && setMenu(null)}>
      <Sidebar />
      <main className="workspace-main">
        <Topbar />
        <div className="workspace-content">
          {pageError && <div className="workspace-alert"><AlertCircle size={17} /><span>{pageError}</span><button onClick={() => setPageError("")}><X size={15} /></button></div>}

          <section className="workspace-header">
            <div className="workspace-header-left">
              <div className="workspace-large-avatar">{initials(workspace.name)}</div>
              <div className="workspace-header-info">
                <div className="workspace-title-row">
                  <h1>{workspace.name}</h1>
                  <button className="workspace-more-button" title="Workspace options" onClick={(e) => { e.stopPropagation(); setMenu(menu === "workspace" ? null : "workspace"); }}><MoreHorizontal size={19} /></button>
                  {menu === "workspace" && <div className="workspace-popover" onClick={(e) => e.stopPropagation()}>
                    {amOwner && <button onClick={openWorkspaceSettings}><Settings size={15} /> Settings</button>}
                    {amOwner && <button className="danger-text" onClick={() => setModal({ type: "confirm", title: "Delete workspace?", message: "This will delete the workspace. Your current backend does not cascade-delete its folders and documents.", confirmLabel: "Delete workspace", danger: true, action: async () => { await request(`/api/v1/workspace/deleteWorkspace/${workspaceId}`, { method: "DELETE" }); navigate("/workspaces"); } })}><Trash2 size={15} /> Delete workspace</button>}
                    {!amOwner && <button className="danger-text" onClick={() => setModal({ type: "confirm", title: "Leave workspace?", message: "You will lose access to this workspace.", confirmLabel: "Leave workspace", danger: true, action: async () => { await request(`/api/v1/workspace/leaveWorkspace/${workspaceId}`, { method: "DELETE" }); navigate("/workspaces"); } })}><LogOut size={15} /> Leave workspace</button>}
                  </div>}
                </div>
                <p className="workspace-description">{workspace.description || "No workspace description added."}</p>
                <div className="workspace-meta">
                  <div className="workspace-owner"><span className="small-avatar">{initials(workspace.owner?.name)}</span><span>Owned by {workspace.owner?.name || "Workspace owner"}</span></div>
                  <span className="meta-separator">•</span>
                  <div className="workspace-members-count"><Users size={15} /><span>{members.length} members</span></div>
                </div>
              </div>
            </div>
            {amOwner && <button className="invite-button" onClick={openInvite}><UserPlus size={17} /> Invite members</button>}
          </section>

          <nav className="workspace-tabs">
            {["Overview", "Documents", "Members"].map((item) => <button key={item} className={`workspace-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
              {item === "Overview" ? <LayoutDashboard size={15} /> : item === "Documents" ? <FileText size={15} /> : <Users size={15} />}{item}
            </button>)}
          </nav>

          <section className="workspace-stats">
            <Stat icon={<FileText size={18} />} label="Documents" value={documents.length} />
            <Stat icon={<Folder size={18} />} label="Folders" value={folders.length} />
            <Stat icon={<Users size={18} />} label="Members" value={members.length} />
            <Stat icon={<Mail size={18} />} label="Pending invites" value={invitations.filter((item) => item.status === "pending").length} />
          </section>

          {tab !== "Members" && <div className="workspace-grid">
            <section className="documents-section">
              <div className="section-header">
                <div><h2>{tab === "Documents" ? "Documents" : "Workspace content"}</h2><p>Manage folders and documents in this workspace</p></div>
                <div className="document-actions">
                  <button className="secondary-action" onClick={openCreateFolder}><FolderPlus size={15} /> New folder</button>
                  <button className="primary-action" onClick={openCreateDocument}><Plus size={15} /> New document</button>
                </div>
              </div>

              <div className="document-toolbar">
                <div className="document-search"><Search size={15} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search folders and documents…" /></div>
                <div className="filter-wrap"><select className="filter-button" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}><option value="all">All content</option><option value="folders">Folders</option><option value="documents">Documents</option></select></div>
              </div>

              {tab === "Overview" && <div className="content-subsection">
                <h3>Folders <span>{visibleFolders.length}</span></h3>
                {visibleFolders.length ? <div className="folder-list">{visibleFolders.map((folder) => <div className="folder-row" key={folder._id}>
                  <div className="content-item-left"><div className="folder-icon"><Folder size={18} /></div><div><h4>{folder.name}</h4><span>{folderDocumentCount(folder._id)} documents · Updated {timeAgo(folder.updatedAt)}</span></div></div>
                  <div className="row-actions">
                    <button className="item-more-button" title="Rename folder" onClick={() => setModal({ type: "renameFolder", title: "Rename folder", id: folder._id, name: folder.name })}><Pencil size={15} /></button>
                    <button className="item-more-button danger-hover" title="Delete folder" onClick={() => confirmDeleteFolder(folder)}><Trash2 size={15} /></button>
                  </div>
                </div>)}</div> : <EmptyState text={search ? "No matching folders." : "No folders yet. Create one to organize your documents."} />}
              </div>}

              <div className="content-subsection">
                <h3>Documents <span>{visibleDocuments.length}</span></h3>
                {visibleDocuments.length ? <div className="document-list">{visibleDocuments.map((doc) => {
                  const access = doc.access || "none";
                  const canEdit = access === "owner" || access === "editor";
                  const canDelete = access === "owner";
                  const ownerName = doc.owner?.name || (getId(doc.owner) === currentUserId ? currentUser?.name : "Workspace member");
                  const folderName = folders.find((folder) => String(folder._id) === String(getId(doc.folder)))?.name;
                  return <div className="document-row" key={doc._id}>
                    <div className="content-item-left"><div className="document-icon"><FileText size={18} /></div><div><h4>{doc.title}</h4><div className="document-info"><span>{ownerName}</span><span>·</span><span>{folderName || "Unfiled"}</span><span>·</span><span>{timeAgo(doc.updatedAt)}</span></div></div></div>
                    <div className="row-actions">
                      {canEdit && <button className="item-more-button" title="Edit document" onClick={() => setModal({ type: "editDocument", title: "Edit document", id: doc._id, name: doc.title, content: doc.content || "", folderId: getId(doc.folder) || "" })}><Pencil size={15} /></button>}
                      {canDelete && <button className="item-more-button danger-hover" title="Delete document" onClick={() => confirmDeleteDocument(doc)}><Trash2 size={15} /></button>}
                    </div>
                  </div>;
                })}</div> : <EmptyState text={search ? "No matching documents." : "No documents yet. Create your first document."} />}
              </div>
            </section>

            <aside className="workspace-right-column">
              <section className="side-section">
                <div className="side-section-header"><div><h2>Members</h2><p>{members.length} people in this workspace</p></div><button className="view-all-button" onClick={() => setTab("Members")}>View all</button></div>
                <div className="members-list">{members.slice(0, 5).map((member) => <div className="member-row" key={member.id}>
                  <div className="member-left"><div className="member-avatar">{initials(member.name || member.email || member.id)}</div><div><h4>{member.name || member.email || `Member ${String(member.id).slice(-6)}`}</h4><span>{member.role}</span></div></div>
                  {amOwner && member.id && member.role !== "owner" && <button className="item-more-button danger-hover" title="Remove member" onClick={() => confirmRemoveMember(member)}><Trash2 size={14} /></button>}
                </div>)}</div>
                {amOwner && <button className="invite-small-button" onClick={openInvite}><UserPlus size={14} /> Invite members</button>}
                {!members.some((member) => member.name || member.email) && <p className="subtle-note">The current workspace API returns member IDs and roles only. Populate members.user to display names and emails.</p>}
              </section>

              <section className="side-section">
                <div className="side-section-header"><div><h2>Pending invitations</h2><p>Invitations sent from this workspace</p></div><span className="count-pill">{invitations.filter((item) => item.status === "pending").length}</span></div>
                {amOwner ? <div className="invitation-list">{invitations.filter((item) => item.status === "pending").map((invitation) => <div className="invitation-row" key={invitation._id}><div><strong>{invitation.email}</strong><span>{invitation.role} · Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span></div><button className="item-more-button danger-hover" title="Cancel invitation" onClick={() => confirmCancelInvitation(invitation)}><X size={15} /></button></div>)}
                  {!invitations.some((item) => item.status === "pending") && <EmptyState text="No pending invitations." />}</div> : <p className="subtle-note">Only the workspace owner can view invitations.</p>}
              </section>
            </aside>
          </div>}

          {tab === "Members" && <section className="documents-section members-page-section">
            <div className="section-header"><div><h2>Workspace members</h2><p>People who currently have access to this workspace</p></div>{amOwner && <button className="primary-action" onClick={openInvite}><UserPlus size={15} /> Invite member</button>}</div>
            <div className="members-list full-members-list">{members.map((member) => <div className="member-row" key={member.id}><div className="member-left"><div className="member-avatar">{initials(member.name || member.email || member.id)}</div><div><h4>{member.name || member.email || `Member ${String(member.id).slice(-6)}`}</h4><span>{member.email || `ID: ${member.id}`} · {member.role}</span></div></div>{amOwner && member.role !== "owner" && <button className="secondary-action" onClick={() => confirmRemoveMember(member)}><Trash2 size={14} /> Remove</button>}</div>)}</div>
            {!members.some((member) => member.name || member.email) && <p className="subtle-note">Member names and email addresses are not populated by the current getWorkspace controller. The IDs and roles above come directly from its response.</p>}
          </section>}

          <div className="workspace-footer-note"><Clock3 size={14} /> Activity history is not available yet because this backend has no activity endpoint.</div>
        </div>
      </main>

      {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
        <div className="workspace-modal">
          <div className="modal-header"><h2>{modal.title}</h2><button className="modal-close" onClick={() => { setModal(null); setPageError(""); }}><X size={18} /></button></div>

          {modal.type === "confirm" ? <>
            <p className="modal-description">{modal.message}</p>
            <div className="modal-actions"><button className="secondary-action" onClick={() => setModal(null)}>Keep</button><button className={modal.danger ? "danger-button" : "primary-action"} disabled={busy} onClick={handleConfirm}>{busy ? "Please wait…" : modal.confirmLabel}</button></div>
          </> : <form onSubmit={submitModal}>
            {(modal.type === "folder" || modal.type === "renameFolder" || modal.type === "document" || modal.type === "editDocument") && <>
              <label>{modal.type.includes("Document") || modal.type === "document" ? "Title" : "Folder name"}</label>
              <input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder={modal.type.toLowerCase().includes("document") ? "Enter document title" : "Enter folder name"} maxLength={100} />
            </>}
            {(modal.type === "folder") && <>
              <label>Parent folder <span className="optional-label">Optional</span></label>
              <select value={modal.parentFolder} onChange={(e) => setModal({ ...modal, parentFolder: e.target.value })}><option value="">Workspace root</option>{folders.map((folder) => <option key={folder._id} value={folder._id}>{folder.name}</option>)}</select>
            </>}
            {(modal.type === "document" || modal.type === "editDocument") && <>
              <label>Folder <span className="optional-label">Optional</span></label>
              <select value={modal.folderId} onChange={(e) => setModal({ ...modal, folderId: e.target.value })}><option value="">Unfiled</option>{folders.map((folder) => <option key={folder._id} value={folder._id}>{folder.name}</option>)}</select>
              <label>Content</label>
              <textarea rows="6" value={modal.content} onChange={(e) => setModal({ ...modal, content: e.target.value })} placeholder="Write something…" />
            </>}
            {modal.type === "invite" && <>
              <label>Email address</label><input autoFocus type="email" value={modal.email} onChange={(e) => setModal({ ...modal, email: e.target.value })} placeholder="name@example.com" required />
              <label>Workspace role</label><select value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })}><option value="editor">Editor</option><option value="viewer">Viewer</option></select>
              <p className="subtle-note">Invitations expire after 24 hours, as configured by your backend.</p>
              {inviteError && <p className="form-error">{inviteError}</p>}
            </>}
            {modal.type === "settings" && <>
              <label>Workspace name</label><input autoFocus value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} maxLength={100} />
              <label>Description</label><textarea rows="4" value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} maxLength={500} />
            </>}
            <div className="modal-actions"><button type="button" className="secondary-action" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="primary-action" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
          </form>}
        </div>
      </div>}
    </div>
  );
};

const Stat = ({ icon, label, value }) => <div className="stat-card"><div className="stat-icon">{icon}</div><div><span className="stat-label">{label}</span><strong>{value}</strong></div></div>;
const EmptyState = ({ text }) => <div className="empty-state">{text}</div>;

export default WorkspaceHome;
