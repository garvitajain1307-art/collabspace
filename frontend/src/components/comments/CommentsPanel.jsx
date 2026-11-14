import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  AtSign,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import api from "../../services/api";
import socket from "../../socket";
import {
  addComment,
  updateCommentInList,
  removeCommentFromList,
  setFilter,
} from "../../features/comment/commentSlice";
import { useToast } from "../common/Toast";

// Mention input sub-component with popup autocomplete
const MentionTextarea = ({
  value,
  onChange,
  onMentionsChange,
  placeholder,
  rows = 2,
  maxLength = 500,
  autoFocus = false,
  className = "",
  collaborators = [],
  onSubmit,
}) => {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Mention dropdown state
  const [mentionQuery, setMentionQuery] = useState(null); // string query when active, null when inactive
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Filter collaborators based on current query
  const filteredCollaborators = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return collaborators;
    return collaborators.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [mentionQuery, collaborators]);

  // Check cursor position for @mention trigger
  const handleInputChange = (e) => {
    const text = e.target.value;
    onChange(text);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf("@");

    if (lastAtPos !== -1) {
      // Check if '@' is at the start or preceded by whitespace
      const charBeforeAt = lastAtPos === 0 ? " " : textBeforeCursor[lastAtPos - 1];
      const textAfterAt = textBeforeCursor.slice(lastAtPos + 1);

      // Trigger if '@' is preceded by space/newline and contains no spaces after it
      if (/[\s\n]/.test(charBeforeAt) && !/\s/.test(textAfterAt)) {
        setMentionQuery(textAfterAt);
        setMentionStartIndex(lastAtPos);
        setHighlightedIndex(0);
        return;
      }
    }

    // Otherwise close mention dropdown
    setMentionQuery(null);
    setMentionStartIndex(-1);
  };

  const insertMention = (collaborator) => {
    if (!collaborator || mentionStartIndex === -1) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea ? textarea.selectionStart : value.length;
    const before = value.slice(0, mentionStartIndex);
    const after = value.slice(cursorPos);
    const mentionText = `@${collaborator.name} `;
    const newText = before + mentionText + after;

    onChange(newText);
    onMentionsChange?.(collaborator);

    // Reset dropdown
    setMentionQuery(null);
    setMentionStartIndex(-1);

    // Focus back and move cursor after the inserted mention
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const nextPos = before.length + mentionText.length;
        textarea.setSelectionRange(nextPos, nextPos);
      }
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (mentionQuery !== null && filteredCollaborators.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredCollaborators.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCollaborators.length - 1
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = filteredCollaborators[highlightedIndex];
        if (selected) {
          insertMention(selected);
        }
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionQuery(null);
        setMentionStartIndex(-1);
        return;
      }
    }

    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setMentionQuery(null);
        setMentionStartIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={className}
      />

      {/* Autocomplete Dropdown */}
      {mentionQuery !== null && filteredCollaborators.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 p-1 divide-y divide-stone-100 dark:divide-stone-800"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1">
            <AtSign size={11} /> Mention Collaborator
          </div>
          <div className="py-0.5">
            {filteredCollaborators.map((c, idx) => (
              <button
                key={c._id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insertMention(c);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs transition cursor-pointer ${
                  idx === highlightedIndex
                    ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-medium"
                    : "text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800/60"
                }`}
              >
                <Avatar name={c.name} src={c.avatar} size="xs" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate leading-snug">{c.name}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate leading-none">
                    {c.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Formats comment text with highlighted @mention badges
const FormattedCommentContent = ({ content, mentions = [] }) => {
  if (!content) return null;

  // Build list of valid mention names for this comment
  const mentionNames = (mentions || [])
    .map((m) => (typeof m === "object" ? m.name : null))
    .filter(Boolean);

  // Split tokens by space/punctuation while preserving mention boundaries
  const words = content.split(/(\s+)/);

  return (
    <p className="text-stone-800 dark:text-stone-200 leading-relaxed font-normal whitespace-pre-wrap break-words">
      {words.map((word, i) => {
        if (word.startsWith("@") && word.length > 1) {
          const rawName = word.slice(1);
          // Check if it matches a known mention or generic mention pattern
          const isKnownMention =
            mentionNames.length === 0 ||
            mentionNames.some(
              (name) =>
                rawName.toLowerCase() === name.toLowerCase() ||
                rawName.toLowerCase().startsWith(name.toLowerCase())
            );

          if (isKnownMention) {
            return (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md text-[11px] font-medium bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40"
              >
                {word}
              </span>
            );
          }
        }
        return <React.Fragment key={i}>{word}</React.Fragment>;
      })}
    </p>
  );
};

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
  const { collaborators } = useSelector((state) => state.collaborator);
  const { selectedDocument } = useSelector((state) => state.document);
  const { selectedWorkspace } = useSelector((state) => state.workspace);

  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentMentions, setNewCommentMentions] = useState([]);

  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyMentions, setReplyMentions] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canResolve = documentAccess === "owner" || documentAccess === "editor";

  // Build the list of eligible collaborators who have access to this document
  const eligibleCollaborators = useMemo(() => {
    const map = new Map();
    const currentUserId = String(user?._id || user?.id || "");

    // 1. Explicit document collaborators
    (collaborators || []).forEach((c) => {
      const u = c.user;
      if (u) {
        const uid = String(u._id || u.id || u);
        if (uid !== currentUserId) {
          map.set(uid, {
            _id: uid,
            name: u.name || "Collaborator",
            email: u.email || "",
            avatar: u.avatar,
          });
        }
      }
    });

    // 2. Document owner
    if (selectedDocument?.owner) {
      const o = selectedDocument.owner;
      const oid = String(o._id || o.id || o);
      if (oid !== currentUserId && !map.has(oid)) {
        map.set(oid, {
          _id: oid,
          name: o.name || "Document Owner",
          email: o.email || "",
          avatar: o.avatar,
        });
      }
    }

    // 3. Workspace owner
    if (selectedWorkspace?.owner) {
      const wo = selectedWorkspace.owner;
      const woid = String(wo._id || wo.id || wo);
      if (woid !== currentUserId && !map.has(woid)) {
        map.set(woid, {
          _id: woid,
          name: wo.name || "Workspace Owner",
          email: wo.email || "",
          avatar: wo.avatar,
        });
      }
    }

    return Array.from(map.values());
  }, [collaborators, selectedDocument, selectedWorkspace, user]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!documentId) return;

    const handleCommentAdded = ({ documentId: docId, comment }) => {
      if (docId === documentId && comment) {
        dispatch(addComment(comment));
      }
    };

    const handleCommentUpdated = ({ documentId: docId, comment }) => {
      if (docId === documentId && comment) {
        dispatch(updateCommentInList(comment));
      }
    };

    const handleCommentDeleted = ({ documentId: docId, commentId }) => {
      if (docId === documentId && commentId) {
        dispatch(removeCommentFromList(commentId));
      }
    };

    const handleCommentResolved = ({ documentId: docId, comment }) => {
      if (docId === documentId && comment) {
        dispatch(updateCommentInList(comment));
      }
    };

    socket.on("commentAdded", handleCommentAdded);
    socket.on("commentUpdated", handleCommentUpdated);
    socket.on("commentDeleted", handleCommentDeleted);
    socket.on("commentResolved", handleCommentResolved);

    return () => {
      socket.off("commentAdded", handleCommentAdded);
      socket.off("commentUpdated", handleCommentUpdated);
      socket.off("commentDeleted", handleCommentDeleted);
      socket.off("commentResolved", handleCommentResolved);
    };
  }, [documentId, dispatch]);

  // Group top-level comments and their replies
  const rootComments = useMemo(
    () => comments.filter((c) => !c.parentComment),
    [comments]
  );

  const repliesMap = useMemo(() => {
    return comments.reduce((acc, c) => {
      if (c.parentComment) {
        const parentId = c.parentComment._id || c.parentComment;
        if (!acc[parentId]) acc[parentId] = [];
        acc[parentId].push(c);
      }
      return acc;
    }, {});
  }, [comments]);

  const openCount = rootComments.filter((c) => !c.resolved).length;
  const resolvedCount = rootComments.filter((c) => c.resolved).length;
  const allCount = rootComments.length;

  const filteredComments = rootComments.filter((c) => {
    if (filter === "open") return !c.resolved;
    if (filter === "resolved") return c.resolved;
    return true;
  });

  // Extract mention IDs from text and tracked selections
  const getSelectedMentionIds = (text, trackedMentions) => {
    const ids = [];
    (trackedMentions || []).forEach((c) => {
      if (text.includes(`@${c.name}`)) {
        ids.push(c._id);
      }
    });
    return [...new Set(ids)];
  };

  const handleCreateComment = async (e) => {
    e?.preventDefault();
    if (!newCommentText.trim()) return;

    setSubmitting(true);
    try {
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

      const mentionIds = getSelectedMentionIds(
        newCommentText,
        newCommentMentions
      );

      const res = await api.post(`/api/v1/comment/${documentId}`, {
        content: newCommentText.trim(),
        position,
        mentions: mentionIds,
      });

      dispatch(addComment(res.comment));

      // Emit to other collaborators via Socket.IO
      socket.emit("commentAdded", {
        documentId,
        comment: res.comment,
      });

      setNewCommentText("");
      setNewCommentMentions([]);
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
      const position = parent?.position || {
        start: 0,
        end: 0,
        selectedText: "",
      };
      const mentionIds = getSelectedMentionIds(replyText, replyMentions);

      const res = await api.post(`/api/v1/comment/${documentId}`, {
        content: replyText.trim(),
        position: {
          start: position.start || 0,
          end: position.end || 0,
          selectedText: position.selectedText || "",
        },
        parentComment: parentCommentId,
        mentions: mentionIds,
      });

      dispatch(addComment(res.comment));

      // Emit to other collaborators via Socket.IO
      socket.emit("commentAdded", {
        documentId,
        comment: res.comment,
      });

      setReplyText("");
      setReplyMentions([]);
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

      // Emit to other collaborators via Socket.IO
      socket.emit("commentUpdated", {
        documentId,
        comment: res.comment,
      });

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

      // Emit to other collaborators via Socket.IO
      socket.emit("commentDeleted", {
        documentId,
        commentId,
      });

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

      // Emit to other collaborators via Socket.IO
      socket.emit("commentResolved", {
        documentId,
        comment: res.comment,
      });

      toast.success(comment.resolved ? "Comment reopened" : "Comment resolved");
    } catch (err) {
      toast.error(err.message || "Action failed");
    }
  };

  return (
    <aside className="w-80 h-full bg-white dark:bg-stone-900 border-l border-stone-200 dark:border-stone-800 flex flex-col shrink-0 overflow-hidden select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50/50 dark:bg-stone-900/50">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-violet-600 dark:text-violet-400" />
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 tracking-tight uppercase">
            Comments
          </h3>
          <span className="text-[10px] bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold px-1.5 py-0.2 rounded-full">
            {allCount}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Segmented Filter Buttons */}
      <div className="p-2 border-b border-stone-100 dark:border-stone-800 bg-stone-50/30 dark:bg-stone-900/30">
        <div className="grid grid-cols-3 gap-1 bg-stone-100/80 dark:bg-stone-800/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => dispatch(setFilter("open"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "open"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => dispatch(setFilter("resolved"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "resolved"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            Resolved ({resolvedCount})
          </button>
          <button
            onClick={() => dispatch(setFilter("all"))}
            className={`py-1 rounded-md text-[11px] transition cursor-pointer ${
              filter === "all"
                ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 font-semibold shadow-2xs"
                : "text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200"
            }`}
          >
            All ({allCount})
          </button>
        </div>
      </div>

      {/* Selected text highlight banner */}
      {selectedTextRange?.selectedText && (
        <div className="p-2.5 mx-3 mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-lg text-xs flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
              Selected text:
            </span>
            <p className="text-amber-900 dark:text-amber-200 italic text-xs truncate mt-0.5">
              “{selectedTextRange.selectedText}”
            </p>
          </div>
          <button
            onClick={onClearSelection}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 p-0.5 rounded cursor-pointer"
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
                  ? "bg-stone-50/80 dark:bg-stone-800/30 border-stone-200/70 dark:border-stone-800 opacity-80"
                  : "bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 shadow-xs hover:border-stone-300 dark:hover:border-stone-600"
              }`}
            >
              {/* Context Quote Tag */}
              {comment.position?.selectedText && (
                <div className="px-3 pt-2.5 pb-1 border-l-2 border-amber-400 bg-amber-50/30 dark:bg-amber-950/20 rounded-t-xl text-[11px] text-amber-900 dark:text-amber-300 italic line-clamp-2">
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
                    <span className="font-semibold text-stone-900 dark:text-stone-100">
                      {comment.user?.name || "User"}
                    </span>
                    <span className="text-[10px] text-stone-400 dark:text-stone-500">
                      {new Date(comment.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    {canResolve && (
                      <button
                        onClick={() => handleToggleResolve(comment)}
                        className={`p-1 rounded cursor-pointer transition ${
                          isResolved
                            ? "text-stone-400 hover:text-violet-600 dark:hover:text-violet-400"
                            : "text-stone-400 hover:text-emerald-600 dark:hover:text-emerald-400"
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
                        className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded cursor-pointer"
                        title="Edit"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {(isAuthor || canResolve) && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="p-1 text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
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
                      className="w-full text-xs p-2 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                  <FormattedCommentContent
                    content={comment.content}
                    mentions={comment.mentions}
                  />
                )}

                {/* Bottom row actions: Reply button */}
                <div className="flex items-center gap-3 mt-2 text-[11px]">
                  <button
                    onClick={() => {
                      setReplyingToId(
                        replyingToId === comment._id ? null : comment._id
                      );
                      setReplyText("");
                      setReplyMentions([]);
                    }}
                    className="text-violet-600 dark:text-violet-400 hover:text-violet-700 font-medium cursor-pointer"
                  >
                    Reply
                  </button>
                  {isResolved && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={11} /> Resolved
                    </span>
                  )}
                </div>
              </div>

              {/* Replies Thread */}
              {replies.length > 0 && (
                <div className="border-t border-stone-100 dark:border-stone-700/60 bg-stone-50/50 dark:bg-stone-900/40 p-2.5 space-y-2 rounded-b-xl">
                  {replies.map((reply) => {
                    const isReplyAuthor =
                      String(
                        reply.user?._id || reply.user?.id || reply.user
                      ) === String(user?.id || user?._id);

                    return (
                      <div
                        key={reply._id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <CornerDownRight
                          size={12}
                          className="text-stone-300 dark:text-stone-600 shrink-0 mt-1"
                        />
                        <Avatar
                          name={reply.user?.name || "User"}
                          src={reply.user?.avatar}
                          size="xs"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-stone-900 dark:text-stone-100 text-[11px]">
                              {reply.user?.name || "User"}
                            </span>
                            <span className="text-[9px] text-stone-400 dark:text-stone-500">
                              {new Date(reply.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <FormattedCommentContent
                              content={reply.content}
                              mentions={reply.mentions}
                            />
                          </div>
                        </div>
                        {(isReplyAuthor || canResolve) && (
                          <button
                            onClick={() => handleDelete(reply._id)}
                            className="p-0.5 text-stone-300 dark:text-stone-600 hover:text-rose-600 dark:hover:text-rose-400 rounded cursor-pointer"
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
                <div className="p-2.5 border-t border-stone-100 dark:border-stone-700/60 bg-white dark:bg-stone-900 space-y-2 rounded-b-xl">
                  <MentionTextarea
                    autoFocus
                    value={replyText}
                    onChange={setReplyText}
                    onMentionsChange={(collab) => {
                      setReplyMentions((prev) =>
                        prev.some((c) => c._id === collab._id)
                          ? prev
                          : [...prev, collab]
                      );
                    }}
                    placeholder="Write a reply... (use @ to mention)"
                    rows={2}
                    maxLength={500}
                    collaborators={eligibleCollaborators}
                    onSubmit={() => handleReply(comment._id)}
                    className="w-full text-xs p-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  />
                  <div className="flex justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingToId(null);
                        setReplyText("");
                        setReplyMentions([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={submitting}
                      disabled={!replyText.trim() || submitting}
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
          <div className="p-8 text-center text-xs text-stone-400 dark:text-stone-500 italic">
            {filter === "resolved"
              ? "No resolved comments."
              : "No comments yet. Highlight text in the document or write below to start a discussion."}
          </div>
        )}
      </div>

      {/* New Comment Input at Bottom */}
      <form
        onSubmit={handleCreateComment}
        className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-2 shrink-0"
      >
        <MentionTextarea
          value={newCommentText}
          onChange={setNewCommentText}
          onMentionsChange={(collab) => {
            setNewCommentMentions((prev) =>
              prev.some((c) => c._id === collab._id) ? prev : [...prev, collab]
            );
          }}
          placeholder={
            selectedTextRange?.selectedText
              ? `Comment on “${selectedTextRange.selectedText.slice(0, 30)}...” (use @)`
              : "Add a comment... (use @ to mention)"
          }
          rows={2}
          maxLength={500}
          collaborators={eligibleCollaborators}
          onSubmit={handleCreateComment}
          className="w-full text-xs p-2.5 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600 transition"
        />
        <div className="flex items-center justify-between text-[11px] text-stone-400 dark:text-stone-500">
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
