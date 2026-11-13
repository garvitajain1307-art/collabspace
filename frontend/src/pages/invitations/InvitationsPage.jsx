import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Check,
  X,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import Avatar, { getColorForString } from "../../components/common/Avatar";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import {
  setMyInvitations,
  removeMyInvitation,
} from "../../features/invitation/invitationSlice";
import { addWorkspace } from "../../features/workspace/workspaceSlice";

export const InvitationsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const toast = useToast();

  const { myInvitations } = useSelector((state) => state.invitation);
  const { workspaces } = useSelector((state) => state.workspace);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received"); // "received" | "sent"
  const [sentInvitations, setSentInvitations] = useState([]);
  const [actionBusyId, setActionBusyId] = useState(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      // 1. Fetch received
      const myRes = await api.get("/api/v1/invitation/getMyInvitations");
      dispatch(setMyInvitations(myRes.invitations || []));

      // 2. Fetch sent invitations across workspaces owned by user
      const ownedWs = (workspaces || []).filter((w) => w.owner?._id || w.owner);
      const sentPromises = ownedWs.map((w) =>
        api
          .get(`/api/v1/invitation/getWorkspaceInvitations/${w._id}`)
          .then((res) =>
            (res.invitations || []).map((inv) => ({
              ...inv,
              workspaceName: w.name,
            }))
          )
          .catch(() => [])
      );

      const allSent = (await Promise.all(sentPromises)).flat();
      setSentInvitations(allSent);
    } catch (err) {
      toast.error(err.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [dispatch]);

  const handleAccept = async (invitationId) => {
    setActionBusyId(invitationId);
    try {
      const res = await api.put(
        `/api/v1/invitation/acceptInvitation/${invitationId}`
      );
      toast.success("Invitation accepted! You joined the workspace.");
      dispatch(removeMyInvitation(invitationId));
      if (res.workspace) {
        dispatch(addWorkspace(res.workspace));
        navigate(`/workspace/${res.workspace._id}`);
      }
    } catch (err) {
      toast.error(err.message || "Failed to accept invitation");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleReject = async (invitationId) => {
    setActionBusyId(invitationId);
    try {
      await api.put(`/api/v1/invitation/rejectInvitation/${invitationId}`);
      toast.success("Invitation declined");
      dispatch(removeMyInvitation(invitationId));
    } catch (err) {
      toast.error(err.message || "Failed to decline invitation");
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCancelSent = async (invitationId) => {
    setActionBusyId(invitationId);
    try {
      await api.put(`/api/v1/invitation/cancelInvitation/${invitationId}`);
      toast.success("Invitation cancelled");
      setSentInvitations((prev) => prev.filter((i) => i._id !== invitationId));
    } catch (err) {
      toast.error(err.message || "Failed to cancel invitation");
    } finally {
      setActionBusyId(null);
    }
  };

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title="Invitations"
          breadcrumbs={[{ label: "Invitations" }]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-4xl">
          <div>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Invitations
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Respond to workspace invitations and keep track of the ones you've sent
            </p>
          </div>

          {/* Segmented Tabs */}
          <div className="flex items-center gap-1 border-b border-stone-200">
            <button
              onClick={() => setActiveTab("received")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "received"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <span>Received</span>
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full font-bold">
                {myInvitations.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === "sent"
                  ? "border-violet-600 text-violet-700 font-bold"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              <span>Sent</span>
              <span className="text-[10px] bg-stone-200 text-stone-600 px-1.5 py-0.2 rounded-full font-bold">
                {sentInvitations.length}
              </span>
            </button>
          </div>

          {/* Tab 1: Received Invitations */}
          {activeTab === "received" && (
            <div className="space-y-3">
              {myInvitations.length > 0 ? (
                myInvitations.map((inv) => {
                  const wsName = inv.workspace?.name || "Workspace";
                  const tagColor = getColorForString(wsName);
                  const initials = wsName.slice(0, 2).toUpperCase();
                  const isBusy = actionBusyId === inv._id;

                  return (
                    <div
                      key={inv._id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
                        >
                          {initials}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-stone-900 truncate">
                              {wsName}
                            </h3>
                            <Badge variant={inv.role} size="sm">
                              {inv.role === "editor" ? "Editor" : "Viewer"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-stone-400 mt-1">
                            <Avatar
                              name={inv.invitedBy?.name || "User"}
                              src={inv.invitedBy?.avatar}
                              size="xs"
                            />
                            <span>
                              {inv.invitedBy?.name || "Workspace member"}{" "}
                              {inv.invitedBy?.email && (
                                <span className="text-stone-400">
                                  ({inv.invitedBy.email})
                                </span>
                              )}{" "}
                              • Invited{" "}
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isBusy}
                          onClick={() => handleReject(inv._id)}
                        >
                          Decline
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Check}
                          loading={isBusy}
                          onClick={() => handleAccept(inv._id)}
                        >
                          Accept
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Mail}
                  title="No pending invitations"
                  description="When team members invite you to collaborate on their workspaces, they'll appear here."
                />
              )}
            </div>
          )}

          {/* Tab 2: Sent Invitations */}
          {activeTab === "sent" && (
            <div className="space-y-3">
              {sentInvitations.length > 0 ? (
                sentInvitations.map((inv) => {
                  const isBusy = actionBusyId === inv._id;

                  return (
                    <div
                      key={inv._id}
                      className="p-4 rounded-xl border border-stone-200/80 bg-white shadow-2xs flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-900 text-xs truncate">
                            {inv.email}
                          </span>
                          <Badge variant={inv.role} size="sm">
                            {inv.role === "editor" ? "Editor" : "Viewer"}
                          </Badge>
                          <Badge
                            variant={inv.status === "pending" ? "pending" : "default"}
                            size="sm"
                          >
                            {inv.status}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5">
                          Workspace:{" "}
                          <strong className="text-stone-700">
                            {inv.workspaceName || "Workspace"}
                          </strong>{" "}
                          • Expires{" "}
                          {new Date(inv.expiresAt).toLocaleDateString()}
                        </div>
                      </div>

                      {inv.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          loading={isBusy}
                          onClick={() => handleCancelSent(inv._id)}
                        >
                          Cancel invite
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <EmptyState
                  icon={Mail}
                  title="No sent invitations"
                  description="Invitations you send to colleagues from your workspaces will appear here."
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default InvitationsPage;
