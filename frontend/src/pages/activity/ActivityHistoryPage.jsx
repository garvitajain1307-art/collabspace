import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  Activity as ActivityIcon,
  Clock,
  ArrowLeft,
  FileText,
  Folder,
  MessageSquare,
  UserPlus,
  Edit,
  Trash2,
  ChevronDown,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import WorkspaceExplorer from "../../components/explorer/WorkspaceExplorer";
import Avatar, { getColorForString } from "../../components/common/Avatar";
import Button from "../../components/common/Button";
import EmptyState from "../../components/common/EmptyState";
import { useToast } from "../../components/common/Toast";
import api from "../../services/api";
import { setSelectedWorkspace } from "../../features/workspace/workspaceSlice";
import { setFolders } from "../../features/folder/folderSlice";
import { setDocuments } from "../../features/document/documentSlice";
import { setActivitiesData } from "../../features/activity/activitySlice";

export const ActivityHistoryPage = () => {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();

  const { selectedWorkspace } = useSelector((state) => state.workspace);
  const { folders } = useSelector((state) => state.folder);
  const { documents } = useSelector((state) => state.document);
  const { activities, totalCount, currentPage, totalPages } = useSelector(
    (state) => state.activity
  );

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const loadWorkspaceDetails = async () => {
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
      console.error(err);
    }
  };

  const loadActivities = async (targetPage = 1, append = false) => {
    if (targetPage > 1) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get(
        `/api/v1/activity/${workspaceId}?page=${targetPage}&limit=15`
      );
      dispatch(setActivitiesData({ ...res, append }));
    } catch (err) {
      toast.error(err.message || "Failed to load activities");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadWorkspaceDetails();
    loadActivities(1, false);
    setPage(1);
  }, [workspaceId]);

  const handleLoadEarlier = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadActivities(nextPage, true);
    }
  };

  // Group by date
  const groupedActivities = useMemo(() => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const groups = {};

    activities.forEach((act) => {
      const dateObj = new Date(act.createdAt);
      const dateStr = dateObj.toDateString();

      let groupTitle = dateStr;
      if (dateStr === today) groupTitle = "TODAY";
      else if (dateStr === yesterday) groupTitle = "YESTERDAY";
      else {
        groupTitle = dateObj
          .toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
          .toUpperCase();
      }

      if (!groups[groupTitle]) groups[groupTitle] = [];
      groups[groupTitle].push(act);
    });

    return groups;
  }, [activities]);

  const tagColor = getColorForString(selectedWorkspace?.name || "");
  const initials = selectedWorkspace?.name?.slice(0, 2).toUpperCase() || "WS";

  return (
    <div className="flex h-screen w-full bg-stone-50 overflow-hidden">
      <Sidebar />

      <WorkspaceExplorer
        workspace={selectedWorkspace}
        folders={folders}
        documents={documents}
        onRefresh={loadWorkspaceDetails}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50">
        <Topbar
          title="Activity History"
          breadcrumbs={[
            { label: "Workspaces", path: "/workspaces" },
            {
              label: selectedWorkspace?.name,
              path: `/workspace/${workspaceId}`,
            },
            { label: "Activity" },
          ]}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Link
              to={`/workspace/${workspaceId}`}
              className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
              title="Back to workspace overview"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 border ${tagColor}`}
                >
                  {initials}
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  {selectedWorkspace?.name}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
                Activity
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                A chronological record of changes made in this workspace
              </p>
            </div>
          </div>

          {/* Activity Timeline List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-stone-400">
              Loading timeline...
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedActivities).map(([dayTitle, items]) => (
                <div key={dayTitle} className="space-y-3">
                  <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider px-1">
                    {dayTitle}
                  </h3>
                  <div className="rounded-xl border border-stone-200/80 bg-white p-4 shadow-2xs divide-y divide-stone-100 space-y-3">
                    {items.map((act) => {
                      // Format activity action into clean, readable text
                      let actionDescription = "";
                      if (act.action === "comment_added") {
                        actionDescription = act.metadata?.isReply
                          ? "replied to a comment on"
                          : "commented on";
                      } else if (act.action === "member_invited") {
                        actionDescription = "invited";
                      } else if (act.action === "member_joined") {
                        actionDescription = "joined the workspace";
                      } else if (act.action === "member_removed") {
                        actionDescription = "removed";
                      } else if (act.action === "member_role_updated") {
                        actionDescription = "updated permissions for";
                      } else if (act.action === "document_created") {
                        actionDescription = "created document";
                      } else if (act.action === "document_updated") {
                        actionDescription = "edited document";
                      } else if (act.action === "document_deleted") {
                        actionDescription = "deleted document";
                      } else if (act.action === "document_shared") {
                        actionDescription = "shared document";
                      } else if (act.action === "folder_created") {
                        actionDescription = "created folder";
                      } else if (act.action === "folder_updated") {
                        actionDescription = "updated folder";
                      } else if (act.action === "folder_deleted") {
                        actionDescription = "deleted folder";
                      } else if (act.action === "workspace_created") {
                        actionDescription = "created this workspace";
                      } else if (act.action === "workspace_updated") {
                        actionDescription = "updated workspace settings";
                      } else {
                        actionDescription = act.action
                          ?.replace(/_/g, " ")
                          ?.toLowerCase();
                      }

                      return (
                        <div
                          key={act._id}
                          className="pt-3 first:pt-0 flex items-start justify-between gap-4 text-xs"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <Avatar
                              name={act.user?.name || "Member"}
                              src={act.user?.avatar}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <p className="text-stone-800 dark:text-stone-200 leading-snug">
                                <strong className="font-semibold text-stone-900 dark:text-stone-100">
                                  {act.user?.name || "Member"}
                                </strong>{" "}
                                <span className="text-stone-600 dark:text-stone-400">
                                  {actionDescription}
                                </span>
                                {act.document && (
                                  <Link
                                    to={`/collaboration/${act.document._id || act.document}`}
                                    className="ml-1 inline-flex items-center gap-1 font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-1.5 py-0.2 rounded hover:underline border border-violet-200/60 dark:border-violet-800/40"
                                  >
                                    <FileText size={11} />
                                    {act.document.title || "Document"}
                                  </Link>
                                )}
                                {act.folder && (
                                  <span className="ml-1 inline-flex items-center gap-1 font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/60 dark:border-amber-800/40">
                                    <Folder size={11} />
                                    {act.folder.name || "Folder"}
                                  </span>
                                )}
                                {act.targetUser && (
                                  <span className="ml-1 font-semibold text-stone-700 dark:text-stone-300">
                                    {act.targetUser.name || "target user"}
                                  </span>
                                )}
                              </p>

                              {/* Only render comment text snippet if backend activity has meaningful text (no generic label) */}
                              {act.metadata?.commentText && (
                                <div className="mt-1.5 p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400 italic text-[11px] max-w-md truncate">
                                  “{act.metadata.commentText}”
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                            {new Date(act.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Load Earlier Activity Button */}
              {page < totalPages && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={ChevronDown}
                    loading={loadingMore}
                    onClick={handleLoadEarlier}
                  >
                    Load earlier activity
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={ActivityIcon}
              title="No activity recorded"
              description="Changes made to documents, folders, and workspace members will automatically be logged here."
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default ActivityHistoryPage;
