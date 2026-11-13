import React, { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from "y-protocols/awareness";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo2,
  Redo2,
  Heading1,
  Heading2,
  Pilcrow,
  MessageSquarePlus,
} from "lucide-react";
import socket, { joinDocument, leaveDocument } from "../../socket";
import { getColorForString } from "../common/Avatar";

export const CollaborativeEditor = ({
  documentId,
  user,
  onAccessChange,
  onOnlineUsersChange,
  onTextSelectionChange,
  onSaveStatusChange,
  readOnly = false,
}) => {
  const [ydoc] = useState(() => new Y.Doc());
  const [awareness] = useState(() => new Awareness(ydoc));
  const [synced, setSynced] = useState(false);
  const [access, setAccess] = useState("viewer");
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState([]);
  const [accessRevokedMessage, setAccessRevokedMessage] = useState(null);

  const editorContainerRef = useRef(null);

  // Yjs & Socket.IO Synchronization
  useEffect(() => {
    if (!documentId) return;

    // Handle local document mutations -> emit to backend
    const handleLocalUpdate = (update, origin) => {
      if (origin === "remote") return;
      onSaveStatusChange?.("saving");
      socket.emit("yjsUpdate", {
        update: Array.from(update),
      });
      setTimeout(() => onSaveStatusChange?.("saved"), 300);
    };

    // Handle incoming server update from other peers
    const handleRemoteUpdate = (data) => {
      if (!data?.update) return;
      const update = new Uint8Array(data.update);
      Y.applyUpdate(ydoc, update, "remote");
      onSaveStatusChange?.("saved");
    };

    // Handle initial state sync from server
    const handleYjsSync = (data) => {
      if (!data) return;
      if (data.update) {
        const update = new Uint8Array(data.update);
        Y.applyUpdate(ydoc, update, "remote");
      }
      setAccess(data.access || "viewer");
      onAccessChange?.(data.access || "viewer");
      setSynced(true);
      onSaveStatusChange?.("saved");
    };

    // Handle local awareness (cursor & selection) -> emit to backend
    const handleLocalAwareness = ({ added, updated, removed }, origin) => {
      if (origin === "remote") return;
      const changedClients = added.concat(updated, removed);
      const update = encodeAwarenessUpdate(awareness, changedClients);
      socket.emit("awarenessUpdate", {
        update: Array.from(update),
      });
    };

    // Handle remote awareness updates
    const handleRemoteAwareness = (data) => {
      if (!data?.update) return;
      const update = new Uint8Array(data.update);
      applyAwarenessUpdate(awareness, update, "remote");

      const states = awareness.getStates();
      const otherUsers = Array.from(states.entries())
        .filter(([clientId]) => clientId !== awareness.clientID)
        .map(([clientId, state]) => ({
          clientId,
          ...state,
        }));

      setRemoteUsers(otherUsers);
    };

    // Handle room presence
    const handleOnlineUsers = (users) => {
      onOnlineUsersChange?.(users || []);
    };

    // Handle access revoked
    const handleAccessRevoked = (data) => {
      setAccessRevokedMessage(data?.message || "Document access was revoked.");
      setAccess("none");
      onAccessChange?.("none");
    };

    // Register listeners
    ydoc.on("update", handleLocalUpdate);
    awareness.on("update", handleLocalAwareness);

    socket.on("yjsSync", handleYjsSync);
    socket.on("yjsUpdate", handleRemoteUpdate);
    socket.on("awarenessUpdate", handleRemoteAwareness);
    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("accessRevoked", handleAccessRevoked);

    // Join room
    joinDocument(documentId);

    // Set local awareness user details
    awareness.setLocalStateField("user", {
      id: user?.id || user?._id,
      name: user?.name || "Anonymous",
      color: getColorForString(user?.name || "user"),
    });

    return () => {
      leaveDocument(documentId);

      ydoc.off("update", handleLocalUpdate);
      awareness.off("update", handleLocalAwareness);

      socket.off("yjsSync", handleYjsSync);
      socket.off("yjsUpdate", handleRemoteUpdate);
      socket.off("awarenessUpdate", handleRemoteAwareness);
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("accessRevoked", handleAccessRevoked);
    };
  }, [ydoc, awareness, documentId, user]);

  const canEdit =
    synced && !readOnly && (access === "owner" || access === "editor");

  // Initialize Tiptap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Yjs manages undo/redo history
      }),
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    editable: canEdit,
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[500px] outline-none max-w-3xl mx-auto px-8 py-6 prose prose-stone text-stone-800 leading-relaxed font-normal focus:outline-none",
      },
    },
  });

  // Keep editor editable state aligned with permissions
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.setEditable(canEdit);
    }
  }, [editor, canEdit]);

  // Track selection for Awareness cursors and Comments anchoring
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;

      // Broadcast cursor range to awareness
      awareness.setLocalStateField("cursor", { from, to });

      // If user selected actual text, pass to callback for comment anchoring
      if (from !== to) {
        const selectedText = editor.state.doc.textBetween(from, to, " ");
        onTextSelectionChange?.({
          start: from,
          end: to,
          selectedText,
        });
      }
    };

    editor.on("selectionUpdate", handleSelectionUpdate);
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, awareness, onTextSelectionChange]);

  // Compute remote cursor screen coordinates relative to the editor container
  useEffect(() => {
    if (!editor || !editorContainerRef.current) return;

    const containerRect = editorContainerRef.current.getBoundingClientRect();
    const cursors = [];

    remoteUsers.forEach((remote) => {
      if (!remote.cursor || remote.cursor.from === undefined) return;
      try {
        const coords = editor.view.coordsAtPos(remote.cursor.from);
        if (coords) {
          cursors.push({
            clientId: remote.clientId,
            name: remote.user?.name || "Peer",
            colorClass: remote.user?.color || "bg-violet-600 text-white",
            x: coords.left - containerRect.left,
            y: coords.top - containerRect.top,
          });
        }
      } catch (e) {
        // Position might be out of range during fast deletions
      }
    });

    setRemoteCursors(cursors);
  }, [editor, remoteUsers]);

  // Populate default template only if brand new empty document
  useEffect(() => {
    if (!editor || !synced) return;
    const fragment = ydoc.getXmlFragment("default");
    if (fragment.length === 0 && (access === "owner" || access === "editor")) {
      editor.commands.setContent(`
        <h1>Project Specification</h1>
        <p>Start documenting notes, requirements, architecture, and meeting summaries with your team.</p>
        <h2>Overview</h2>
        <p>Outline high-level goals and context here. Team members can collaborate in real time and leave comments on any section.</p>
        <h2>Key Requirements</h2>
        <ul>
          <li>Real-time synchronization across all team members</li>
          <li>Granular workspace and document permission control</li>
          <li>Threaded discussion comments and resolution tracking</li>
        </ul>
      `);
    }
  }, [editor, synced, access]);

  if (accessRevokedMessage) {
    return (
      <div className="p-12 text-center max-w-md mx-auto my-auto space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Pilcrow size={24} />
        </div>
        <h3 className="text-base font-bold text-stone-900">Access Revoked</h3>
        <p className="text-xs text-stone-500">{accessRevokedMessage}</p>
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">
      {/* Editor Formatting Toolbar */}
      <div className="h-10 border-b border-stone-200/80 px-6 flex items-center justify-between shrink-0 bg-stone-50/60 sticky top-0 z-10 select-none">
        <div className="flex items-center gap-1 overflow-x-auto text-stone-600">
          {/* Headings */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("paragraph") ? "bg-stone-200 text-stone-900 font-bold" : ""
            }`}
            title="Normal text"
          >
            <Pilcrow size={14} />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("heading", { level: 1 }) ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Heading 1"
          >
            <Heading1 size={14} />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("heading", { level: 2 }) ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Heading 2"
          >
            <Heading2 size={14} />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Inline Styles */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("bold") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Bold (⌘B)"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("italic") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Italic (⌘I)"
          >
            <Italic size={14} />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Lists */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("bulletList") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Bullet list"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("orderedList") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Numbered list"
          >
            <ListOrdered size={14} />
          </button>

          <div className="h-4 w-px bg-stone-200 mx-1" />

          {/* Blocks */}
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("blockquote") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Quote"
          >
            <Quote size={14} />
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
              editor.isActive("codeBlock") ? "bg-stone-200 text-violet-700 font-bold" : ""
            }`}
            title="Code block"
          >
            <Code size={14} />
          </button>
        </div>

        {/* Read-only indicator */}
        {!canEdit && synced && (
          <span className="text-[11px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded border border-amber-200">
            Read-only mode (Viewer access)
          </span>
        )}
      </div>

      {/* Editor Content Canvas with Relative Coordinates for Cursors */}
      <div
        ref={editorContainerRef}
        className="flex-1 overflow-y-auto relative bg-white"
      >
        {/* Render remote peer cursors */}
        {remoteCursors.map((c) => (
          <div
            key={c.clientId}
            className="absolute pointer-events-none z-20 transition-all duration-75"
            style={{ left: `${c.x}px`, top: `${c.y}px` }}
          >
            {/* Colored vertical line */}
            <div className="w-[2px] h-4.5 bg-violet-600" />
            {/* Name badge */}
            <div className="absolute -top-4 left-0 text-[10px] bg-violet-600 text-white font-semibold px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap">
              {c.name}
            </div>
          </div>
        ))}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default CollaborativeEditor;
