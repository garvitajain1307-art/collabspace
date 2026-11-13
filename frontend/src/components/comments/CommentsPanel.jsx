import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  MessageSquare,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  X,
  Send,
  CornerDownRight,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import api from "../../services/api";
import {
  addComment,
  updateCommentInList,
  removeCommentFromList,
  setFilter,
} from "../../features/comment/commentSlice";
import { useToast } from "../common/Toast";

export const CommentsPanel = ({
  documentId,
  documentAccess, // "owner" | "editor" | "viewer"
  selectedTextRange = null, // { start, end, selectedText }
  onClearSelection,
  onClose,
}) => {
  const dispatch = useDispatch();
  const toast = useToast();

  const { user } = useSelector((state) => state.auth);
  const { comments, filter } = useSelector((state) => state.comment);

  const [newCommentText, setNewCommentText] = useState("");
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canResolve = documentAccess === "owner" || documentAccess === "editor";

  // Group top-level comments and their replies
  const rootComments = comments.filter((c) => !c.parentComment);
  const repliesMap = comments.reduce((acc, c) => {
    if (c.parentComment) {
      const parentId = c.parentComment._id || c.parentComment;
      if (!acc[parentId]) acc[parentId] = [];
      acc[parentId].push(c);
    }
    return acc;
  }, {});

  const openCount = rootComments.filter((c) => !c.resolved).length;
  const resolvedCount = rootComments.filter((c) => c.resolved).length;
  const allCount = rootComments.length;

  const filteredComments = rootComments.filter((c) => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  const handleCreateComment = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    try {
      // Backend requires position: { start, end, selectedText } with integer start & end
      const position = selectedTextRange
        ? {
            start: Math.max(0, parseInt(selectedTextRange.start, 10) || 0),
            end: Math.max(
              0,
              parseInt(selectedTextRange.end, 10) ||
                parseInt(selectedTextRange.start, 10) ||
                0
            ),
            selectedText: selectedTextRange.selectedText || "",
          }
        : {
            start: 0,
            end: 0,
            selectedText: "",
          };

      const res = await api.post(`/api/v1/comment/${documentId}`, {
        content: newCommentText.trim(),
        position,
      });

      dispatch(addComment(res.comment));
      setNewCommentText("");
      onClearSelection?.();
      toast.success("Comment added");
    } catch (err) {
      toast.error(err.message || "Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const parent = comments.find((c) => c._id === parentCommentId);
      const position = parent?.position || { start: 0, end: 0, selectedText: "" };

      const res = await api.post(`/api/v1/comment/${documentId}`, {
        content: replyText.trim(),
        position: {
          start: position.start || 0,
          end: position.end || 0,
          selectedText: position.selectedText || "",
        },
        parentComment: parentCommentId,
      });

      dispatch(addComment(res.comment));
      setReplyText("");
      setReplyingToId(null);
      toast.success("Reply posted");
    } catch (err) {
      toast.error(err.message || "Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.put(`/api/v1/comment/update/${commentId}`, {
        content: editText.trim(),
      });
      dispatch(updateCommentInList(res.comment));
      setEditingId(null);
      setEditText("");
      toast.success("Comment updated");
    } catch (err) {
      toast.error(err.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/api/v1/comment/delete/${commentId}`);
      dispatch(removeCommentFromList(commentId));
      toast.success("Comment deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete comment");
    }
  };

  const handleToggleResolve = async (comment) => {
    try {
      const res = await api.patch(`/api/v1/comment/resolve/${comment._id}`, {
        resolved: !comment.resolved,
      });
      dispatch(updateCommentInList(res.comment));
      toast.success(comment.resolved ? "Comment reopened" : "Comment resolved");
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  return (
    <aside className="w-80 h-full bg-white border-l border-stone-200 flex flex-col shrink-0 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-600" />
          <h3 className="text-xs font-bold text-stone-900 tracking-tight uppercase">
            Comments
          </h3>
          <span className="text-[10px] bg-stone-200 text-stone-600 font-bold px-1.5 py-0.2 rounded-full">
            {allCount}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Segmented Filter Buttons */}
      <div className="p-2 border-b border-stone-100 bg-stone-50/30">
        <div className="grid grid-cols-3 gap-1 bg-stone-100/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => dispatch(setFilter("open"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "open"
                ? "bg-white text-stone-900 font-semibold shadow-2xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => dispatch(setFilter("resolved"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "resolved"
                ? "bg-white text-stone-900 font-semibold shadow-2xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => dispatch(setFilter("all"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "all"
                ? "bg-white text-stone-900 font-semibold shadow-2xs"
                : "text-stone-500 hover:text-stone-900"
            }`}
          >
            All ({allCount})
          </button>
        </div>
      </div>

      {/* Selected text highlight banner */}
      {selectedTextRange?.selectedText && (
        <div className="p-2.5 mx-3 mt-2 bg-amber-50 border border-amber-200/80 rounded-lg text-xs flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
              Selected text:
            </span>
            <p className="text-amber-900 italic text-xs truncate mt-0.5">
              “{selectedTextRange.selectedText}”
            </p>
          </div>
          <button
            onClick={onClearSelection}
            className="text-amber-600 hover:text-amber-800 p-0.5 rounded cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredComments.map((comment) => {
          const isAuthor =
            String(comment.user?._id || comment.user?.id || comment.user) ===
            String(user?.id || user?._id);
          const replies = repliesMap[comment._id] || [];
          const isResolved = comment.resolved;

          return (
            <div
              key={comment._id}
              className={`rounded-xl border transition-all text-xs ${
                isResolved
                  ? "bg-stone-50/80 border-stone-200/70 opacity-80"
                  : "bg-white border-stone-200 shadow-xs hover:border-stone-300"
              }`}
            >
              {/* Context Quote Tag */}
              {comment.position?.selectedText && (
                <div className="px-3 pt-2.5 pb-1 border-l-2 border-amber-400 bg-amber-50/30 rounded-t-xl text-[11px] text-amber-900 italic line-clamp-2">
                  “{comment.position.selectedText}”
                </div>
              )}

              {/* Top info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={comment.user?.name || "User"}
                      src={comment.user?.avatar}
                      size="xs"
                    />
                    <span className="font-semibold text-stone-900">
                      {comment.user?.name || "User"}
                    </span>
                    <span className="text-[10px] text-stone-400">
                      {new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actions dropdown or buttons */}
                  <div className="flex items-center gap-1">
                    {canResolve && (
                      <button
                        onClick={() => handleToggleResolve(comment)}
                        className={`p-1 rounded cursor-pointer transition ${
                          isResolved
                            ? "text-stone-400 hover:text-violet-600"
                            : "text-stone-400 hover:text-emerald-600"
                        }`}
                        title={isResolved ? "Reopen comment" : "Resolve comment"}
                      >
                        {isResolved ? (
                          <RotateCcw size={13} />
                        ) : (
                          <CheckCircle2 size={13} />
                        )}
                      </button>
                    )}
                    {isAuthor && (
                      <button
                        onClick={() => {
                          setEditingId(comment._id);
                          setEditText(comment.content);
                        }}
                        className="p-1 text-stone-400 hover:text-stone-700 rounded cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {(isAuthor || canResolve) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Comment Content / Edit mode */}
                {editingId === comment._id ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        loading={submitting}
                        onClick={() => handleUpdate(comment._id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {comment.content}
                  </p>
                )}

                {/* Bottom row actions: Reply button */}
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <button
                    onClick={() => {
                      setReplyingToId(
                        replyingToId === comment._id ? null : comment._id
                      );
                      setReplyText("");
                    }}
                    className="text-violet-600 hover:text-violet-700 font-medium cursor-pointer"
                  >
                    Reply
                  </button>
                  {isResolved && (
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Replies Thread */}
              {replies.length > 0 && (
                <div className="border-t border-stone-100 bg-stone-50/50 p-2.5 space-y-2 rounded-b-xl">
                  {replies.map((reply) => {
                    const isReplyAuthor =
                      String(reply.user?._id || reply.user?.id || reply.user) ===
                      String(user?.id || user?._id);

                    return (
                      <div key={reply._id} className="flex items-start gap-2 text-xs">
                        <CornerDownRight
                          size={12}
                          className="text-stone-300 shrink-0 mt-1"
                        />
                        <Avatar
                          name={reply.user?.name || "User"}
                          src={reply.user?.avatar}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-900 text-[11px]">
                              {reply.user?.name || "User"}
                            </span>
                            <span className="text-[9px] text-stone-400">
                              {new Date(reply.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-stone-700 leading-snug mt-0.5">
                            {reply.content}
                          </p>
                        </div>
                        {(isReplyAuthor || canResolve) && (
                          <button
                            onClick={() => handleDelete(reply._id)}
                            className="p-0.5 text-stone-300 hover:text-rose-600 rounded cursor-pointer"
                            title="Delete reply"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Inline Reply Form */}
              {replyingToId === comment._id && (
                <div className="p-2.5 border-t border-stone-100 bg-white space-y-2 rounded-b-xl">
                  <textarea
                    autoFocus
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    maxLength={500}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReplyingToId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      onClick={() => handleReply(comment._id)}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredComments.length === 0 && (
          <div className="p-8 text-center text-xs text-stone-400 italic">
            {filter === "resolved"
              ? "No resolved comments."
              : "No comments yet. Highlight text in the document or write below to start a discussion."}
          </div>
        )}
      </div>

      {/* New Comment Input at Bottom */}
      <form
        onSubmit={handleCreateComment}
        className="p-3 border-t border-stone-200 bg-white space-y-2 shrink-0"
      >
        <textarea
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          placeholder={
            selectedTextRange?.selectedText
              ? `Comment on “${selectedTextRange.selectedText.slice(0, 30)}...”`
              : "Add a comment..."
          }
          rows={2}
          maxLength={500}
          className="w-full text-xs p-2.5 rounded-lg border border-stone-200 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
        />
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>{selectedTextRange ? "Anchored to text" : "General comment"}</span>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={Send}
            disabled={!newCommentText.trim() || submitting}
            loading={submitting}
          >
            Send
          </Button>
        </div>
      </form>
    </aside>
  );
};

export default CommentsPanel;
