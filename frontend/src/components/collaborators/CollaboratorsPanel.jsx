import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Users,
  UserPlus,
  ShieldAlert,
  ChevronDown,
  Trash2,
  X,
  Shield,
  Eye,
  Edit3,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import Button from "../common/Button";
import Modal from "../common/Modal";
import api from "../../services/api";
import {
  setCollaborators,
  updateCollaboratorInList,
  removeCollaboratorFromList,
} from "../../features/collaborator/collaboratorSlice";
import { useToast } from "../common/Toast";

export const CollaboratorsPanel = ({
  document,
  workspace,
  documentAccess, // "owner" | "editor" | "viewer"
  onClose,
  onRefresh,
}) => {
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { collaborators } = useSelector((state) => state.collaborator);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedPermission, setSelectedPermission] = useState("editor");
  const [submitting, setSubmitting] = useState(false);

  const isDocOwner = documentAccess === "owner";

  // Existing collaborator user IDs
  const existingCollaboratorIds = new Set(
    (collaborators || []).map((c) => String(c.user?._id || c.user?.id || c.user))
  );
  // Add document owner ID as existing
  const ownerId = String(document?.owner?._id || document?.owner?.id || document?.owner);
  existingCollaboratorIds.add(ownerId);

  // Available workspace members who can be added
  const availableMembers = (workspace?.members || []).filter((m) => {
    const memberId = String(m.user?._id || m.user?.id || m.user);
    return !existingCollaboratorIds.has(memberId);
  });

  const handleAddCollaborator = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setSubmitting(true);
    try {
      await api.post(`/api/v1/document/addCollaborator/${document._id}`, {
        userId: selectedUserId,
        permission: selectedPermission,
      });
      toast.success("Collaborator added");
      setAddModalOpen(false);
      setSelectedUserId("");
      onRefresh?.();
    } catch (err) {
      toast.error(err.message || "Failed to add collaborator");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePermission = async (userId, newPermission) => {
    try {
      await api.put(
        `/api/v1/document/updateCollaboratorPermission/${document._id}/${userId}`,
        {
          permission: newPermission,
        }
      );
      dispatch(
        updateCollaboratorInList({ userId, permission: newPermission })
      );
      toast.success("Permission updated");
    } catch (err) {
      toast.error(err.message || "Failed to update permission");
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    try {
      await api.delete(
        `/api/v1/document/removeCollaborator/${document._id}/${userId}`
      );
      dispatch(removeCollaboratorFromList(userId));
      toast.success("Collaborator removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove collaborator");
    }
  };

  return (
    <>
      <aside className="w-80 h-full bg-white border-l border-stone-200 flex flex-col shrink-0 overflow-hidden select-none">
        {/* Header */}
        <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-violet-600" />
            <h3 className="text-xs font-bold text-stone-900 tracking-tight uppercase">
              Manage Collaborators
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 bg-violet-50/60 border-b border-violet-100 text-xs text-violet-950 flex items-start gap-2">
          <ShieldAlert size={15} className="text-violet-600 shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px] text-violet-900">
            Only people listed here can open this document. Workspace membership does
            not grant document access automatically.
          </p>
        </div>

        {/* Section title & Add button */}
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-stone-100 bg-stone-50/30">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">
            {1 + (collaborators?.length || 0)} People with access
          </span>
          {isDocOwner && (
            <Button
              variant="primary"
              size="sm"
              icon={UserPlus}
              onClick={() => setAddModalOpen(true)}
              disabled={availableMembers.length === 0}
            >
              Add collaborator
            </Button>
          )}
        </div>

        {/* Collaborators List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* Document Owner Row */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-stone-50/50 border border-stone-100 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar
                name={document?.owner?.name || "Owner"}
                src={document?.owner?.avatar}
                size="sm"
              />
              <div className="flex flex-col text-left min-w-0">
                <span className="font-semibold text-stone-900 truncate">
                  {document?.owner?.name || "Document Owner"}{" "}
                  {String(document?.owner?._id || document?.owner) ===
                    String(user?.id || user?._id) && (
                    <span className="text-stone-400 font-normal">(you)</span>
                  )}
                </span>
                <span className="text-[10px] text-stone-400 truncate">
                  {document?.owner?.email || ""}
                </span>
              </div>
            </div>
            <Badge variant="owner" size="sm">
              Owner
            </Badge>
          </div>

          {/* Collaborator Rows */}
          {collaborators.map((collab) => {
            const memberUser = collab.user;
            const memberId = memberUser?._id || memberUser?.id || memberUser;
            const isSelf = String(memberId) === String(user?.id || user?._id);

            return (
              <div
                key={memberId}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-100 transition text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar
                    name={memberUser?.name || "Member"}
                    src={memberUser?.avatar}
                    size="sm"
                  />
                  <div className="flex flex-col text-left min-w-0">
                    <span className="font-semibold text-stone-900 truncate">
                      {memberUser?.name || "Collaborator"}{" "}
                      {isSelf && (
                        <span className="text-stone-400 font-normal">(you)</span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400 truncate">
                      {memberUser?.email || ""}
                    </span>
                  </div>
                </div>

                {isDocOwner ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={collab.permission}
                      onChange={(e) =>
                        handleUpdatePermission(memberId, e.target.value)
                      }
                      className="text-xs bg-white border border-stone-200 rounded-md px-2 py-1 text-stone-700 font-medium focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveCollaborator(memberId)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer transition"
                      title="Remove collaborator"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <Badge variant={collab.permission} size="sm">
                    {collab.permission === "editor" ? "Editor" : "Viewer"}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom helper text */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/50 text-[11px] text-stone-400 text-center">
          Editors can edit and comment. Viewers can read and comment.
        </div>
      </aside>

      {/* Add Collaborator Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add collaborator"
        description="Select a workspace member to grant document access."
      >
        <form onSubmit={handleAddCollaborator} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Select Workspace Member
            </label>
            <select
              required
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full text-xs rounded-lg border border-stone-300 p-2.5 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
            >
              <option value="">Choose a member...</option>
              {availableMembers.map((m) => {
                const memberUser = m.user;
                const id = memberUser?._id || memberUser?.id || memberUser;
                const name = memberUser?.name || `Member ${String(id).slice(-6)}`;
                const email = memberUser?.email ? ` (${memberUser.email})` : "";
                return (
                  <option key={id} value={id}>
                    {name}
                    {email}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">
              Permission
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPermission("editor")}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedPermission === "editor"
                    ? "border-violet-600 bg-violet-50/50 text-violet-900"
                    : "border-stone-200 hover:border-stone-300 text-stone-700"
                }`}
              >
                <Edit3 size={15} className="mt-0.5 text-violet-600" />
                <div>
                  <div className="text-xs font-bold">Editor</div>
                  <div className="text-[10px] text-stone-500">Can view & edit</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPermission("viewer")}
                className={`p-2.5 rounded-lg border text-left flex items-start gap-2 transition cursor-pointer ${
                  selectedPermission === "viewer"
                    ? "border-violet-600 bg-violet-50/50 text-violet-900"
                    : "border-stone-200 hover:border-stone-300 text-stone-700"
                }`}
              >
                <Eye size={15} className="mt-0.5 text-stone-500" />
                <div>
                  <div className="text-xs font-bold">Viewer</div>
                  <div className="text-[10px] text-stone-500">Can view & comment</div>
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={submitting}
              disabled={!selectedUserId}
            >
              Add collaborator
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default CollaboratorsPanel;
