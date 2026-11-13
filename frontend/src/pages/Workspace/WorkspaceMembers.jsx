import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  UserPlus,
  ArrowLeft,
  Trash2,
  Edit,
  Shield,
  Clock,
  MoreVertical,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import WorkspaceExplorer from "../../components/explorer/WorkspaceExplorer";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import { setSelectedWorkspace } from "../../features/workspace/workspaceSlice";
import { setFolders } from "../../features/folder/folderSlice";
import { setDocuments } from "../../features/document/documentSlice";

export const WorkspaceMembers = () => {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { selectedWorkspace } = useSelector((state) => state.workspace);
  const { folders } = useSelector((state) => state.folder);
  const { documents } = useSelector((state) => state.document);

  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  const [editRoleMember, setEditRoleMember] = useState(null);
  const [newRole, setNewRole] = useState("editor");

  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadWorkspace = async () => {
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
      toast.error(err.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadWorkspace();
  }, [workspaceId]);

  const isOwner =
    String(
      selectedWorkspace?.owner?._id ||
        selectedWorkspace?.owner?.id ||
        selectedWorkspace?.owner
    ) === String(user?.id || user?._id);

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

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editRoleMember) return;
    setActionBusy(true);
    try {
      const memberId =
        editRoleMember.user?._id ||
        editRoleMember.user?.id ||
        editRoleMember.user;
      await api.put(
        `/api/v1/workspace/updateMemberRole/${workspaceId}/members/${memberId}`,
        { role: newRole }
      );
      toast.success("Member role updated");
      setEditRoleMember(null);
      loadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberTarget) return;
    setActionBusy(true);
    try {
      const memberId =
        removeMemberTarget.user?._id ||
        removeMemberTarget.user?.id ||
        removeMemberTarget.user;
      await api.delete(
        `/api/v1/workspace/deleteMember/${workspaceId}/members/${memberId}`
      );
      toast.success("Member removed from workspace");
      setRemoveMemberTarget(null);
      loadWorkspace();
    } catch (err) {
      toast.error(err.message || "Failed to remove member");
    } finally {
      setActionBusy(false);
    }
  };

  const members = selectedWorkspace?.members || [];

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <WorkspaceExplorer
        workspace={selectedWorkspace}
        folders={folders}
        documents={documents}
        onRefresh={loadWorkspace}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title="Workspace Members"
          breadcrumbs={[
            { label: "Workspaces", path: "/workspaces" },
            {
              label: selectedWorkspace?.name,
              path: `/workspace/${workspaceId}`,
            },
            { label: "Members" },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to={`/workspace/${workspaceId}`}
                className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
                title="Back to workspace overview"
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                  Workspace Members
                </h1>
                <p className="text-xs text-stone-500">
                  People who currently have access to {selectedWorkspace?.name}
                </p>
              </div>
            </div>

            {isOwner && (
              <Button
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setInviteModalOpen(true)}
              >
                Invite member
              </Button>
            )}
          </div>

          {/* Members Table */}
          <div className="rounded-xl border border-stone-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="grid grid-cols-12 px-4 py-2.5 bg-stone-50/70 border-b border-stone-100 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              <div className="col-span-6 sm:col-span-5">Member</div>
              <div className="col-span-3 sm:col-span-3">Role</div>
              <div className="col-span-3 sm:col-span-2 hidden sm:block">Joined</div>
              <div className="col-span-3 sm:col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-stone-100 text-xs">
              {members.map((m) => {
                const memberUser = m.user;
                const memberId =
                  memberUser?._id || memberUser?.id || memberUser;
                const isMemberOwner = m.role === "owner";
                const isSelf = String(memberId) === String(user?.id || user?._id);

                return (
                  <div
                    key={memberId}
                    className="grid grid-cols-12 px-4 py-3 items-center hover:bg-stone-50 transition"
                  >
                    <div className="col-span-6 sm:col-span-5 flex items-center gap-3 min-w-0">
                      <Avatar
                        name={memberUser?.name || "Member"}
                        src={memberUser?.avatar}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-stone-900 truncate">
                          {memberUser?.name || "Member"}{" "}
                          {isSelf && (
                            <span className="text-stone-400 font-normal">(you)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-stone-400 truncate">
                          {memberUser?.email || `ID: ${String(memberId).slice(-6)}`}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-3 sm:col-span-3">
                      <Badge variant={m.role} size="sm">
                        {m.role === "owner"
                          ? "Owner"
                          : m.role === "editor"
                          ? "Editor"
                          : "Viewer"}
                      </Badge>
                    </div>

                    <div className="col-span-3 sm:col-span-2 hidden sm:flex items-center gap-1.5 text-stone-400">
                      <Clock size={12} />
                      <span>
                        {m.joinedAt
                          ? new Date(m.joinedAt).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>

                    <div className="col-span-3 sm:col-span-2 flex items-center justify-end gap-1">
                      {isOwner && !isMemberOwner && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditRoleMember(m);
                              setNewRole(m.role || "editor");
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition cursor-pointer"
                            title="Change role"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveMemberTarget(m)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite new member"
        description="Send an invitation by email to grant workspace access."
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
              Role
            </label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            >
              <option value="editor">Editor (Can create & edit folders/docs)</option>
              <option value="viewer">Viewer (Read-only)</option>
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

      {/* Change Role Modal */}
      <Modal
        isOpen={Boolean(editRoleMember)}
        onClose={() => setEditRoleMember(null)}
        title="Change member role"
        description={`Update workspace permissions for ${editRoleMember?.user?.name || "Member"}.`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            >
              <option value="editor">Editor (Can create & edit)</option>
              <option value="viewer">Viewer (Read-only)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRoleMember(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={actionBusy}
            >
              Update role
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(removeMemberTarget)}
        onClose={() => setRemoveMemberTarget(null)}
        title="Remove member?"
        description={`Remove ${removeMemberTarget?.user?.name || "this member"} from the workspace? They will lose access to all workspace documents.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRemoveMemberTarget(null)}
          >
            Keep
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={actionBusy}
            onClick={handleRemoveMember}
          >
            Remove member
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceMembers;
