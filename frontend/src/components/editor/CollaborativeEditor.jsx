
import React, { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";

import {
    Awareness,
    encodeAwarenessUpdate,
    applyAwarenessUpdate,
} from "y-protocols/awareness";

import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Code,
    Heading1,
    Heading2,
    Pilcrow,
} from "lucide-react";

import socket, {
    joinDocument,
    leaveDocument,
} from "../../socket";

import { getColorForString } from "../common/Avatar";

export const CollaborativeEditor = ({
    documentId,
    user,
    onAccessChange,
    onOnlineUsersChange,
    onTextSelectionChange,
    onSaveStatusChange,
}) => {
    const [ydoc] = useState(() => new Y.Doc());
    const [awareness] = useState(() => new Awareness(ydoc));

    const [synced, setSynced] = useState(false);
    const [access, setAccess] = useState("viewer");
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState([]);
    const [accessRevokedMessage, setAccessRevokedMessage] = useState(null);
    const [syncError, setSyncError] = useState(null);

    const editorContainerRef = useRef(null);

    // Refs used by socket and Yjs handlers
    const syncedRef = useRef(false);
    const accessRef = useRef("viewer");
    const saveTimerRef = useRef(null);

    // Initialize Tiptap editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                history: false,
            }),
            Collaboration.configure({
                document: ydoc,
            }),
        ],
        editable: false,
        editorProps: {
            attributes: {
                class:
                    "min-h-[500px] outline-none max-w-3xl mx-auto px-8 py-6 prose prose-stone text-stone-800 leading-relaxed font-normal focus:outline-none",
            },
        },
    });

    // Document synchronization
    useEffect(() => {
        if (!documentId) return;

        let isActive = true;
        let joined = false;

        syncedRef.current = false;
        accessRef.current = "viewer";

        setSynced(false);
        setAccess("viewer");
        setRemoteUsers([]);
        setRemoteCursors([]);
        setAccessRevokedMessage(null);
        setSyncError(null);

        onAccessChange?.("viewer");
        onOnlineUsersChange?.([]);

        // Local Yjs updates
        const handleLocalUpdate = (update, origin) => {
            if (!isActive || origin === "remote") return;

            if (!joined || !syncedRef.current) return;

            if (
                accessRef.current !== "owner" &&
                accessRef.current !== "editor"
            ) {
                return;
            }

            onSaveStatusChange?.("saving");

            socket.emit("yjsUpdate", {
                update: Array.from(update),
            });

            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }

            saveTimerRef.current = setTimeout(() => {
                if (isActive) {
                    onSaveStatusChange?.("saved");
                }
            }, 500);
        };

        // Receive remote Yjs updates
        const handleRemoteUpdate = (data) => {
            if (!isActive || !data?.update) return;

            if (
                String(data.documentId) !== String(documentId)
            ) {
                return;
            }

            Y.applyUpdate(
                ydoc,
                new Uint8Array(data.update),
                "remote"
            );

            onSaveStatusChange?.("saved");
        };

        // Receive initial Yjs state
        const handleYjsSync = (data) => {
            if (!isActive || !data) return;

            if (
                String(data.documentId) !== String(documentId)
            ) {
                return;
            }

            if (data.update) {
                Y.applyUpdate(
                    ydoc,
                    new Uint8Array(data.update),
                    "remote"
                );
            }

            const currentAccess = data.access || "viewer";

            accessRef.current = currentAccess;
            syncedRef.current = true;

            setAccess(currentAccess);
            setSynced(true);

            onAccessChange?.(currentAccess);
            onSaveStatusChange?.("saved");

            setSyncError(null);

            console.log("YJS SYNC COMPLETE:", documentId, currentAccess);
        };

        // Local awareness updates
        const handleLocalAwareness = (
            { added, updated, removed },
            origin
        ) => {
            if (!isActive || origin === "remote") return;

            if (!joined || !syncedRef.current) return;

            const changedClients = [
                ...added,
                ...updated,
                ...removed,
            ];

            if (changedClients.length === 0) return;

            const update = encodeAwarenessUpdate(
                awareness,
                changedClients
            );

            socket.emit("awarenessUpdate", {
                update: Array.from(update),
            });
        };

        // Remote awareness updates
        const handleRemoteAwareness = (data) => {
            if (!isActive || !data?.update) return;

            if (
                String(data.documentId) !== String(documentId)
            ) {
                return;
            }

            applyAwarenessUpdate(
                awareness,
                new Uint8Array(data.update),
                "remote"
            );

            const states = awareness.getStates();

            const otherUsers = Array.from(states.entries())
                .filter(
                    ([clientId]) => clientId !== awareness.clientID
                )
                .map(([clientId, state]) => ({
                    clientId,
                    ...state,
                }));

            setRemoteUsers(otherUsers);
        };

        // Online users
        const handleOnlineUsers = (users) => {
            if (!isActive) return;

            onOnlineUsersChange?.(users || []);
        };

        // Access revoked
        const handleAccessRevoked = (data) => {
            if (!isActive) return;

            accessRef.current = "none";
            syncedRef.current = false;

            setAccess("none");
            setSynced(false);

            setAccessRevokedMessage(
                data?.message || "Document access was revoked."
            );

            onAccessChange?.("none");
        };

        // Join error
        const handleJoinError = (message) => {
            if (!isActive) return;

            joined = false;
            syncedRef.current = false;
            accessRef.current = "viewer";

            setSynced(false);
            setAccess("viewer");

            setSyncError(
                typeof message === "string"
                    ? message
                    : "Unable to join this document."
            );

            onAccessChange?.("viewer");
        };

        // Disconnect
        const handleDisconnect = () => {
            if (!isActive) return;

            joined = false;
            syncedRef.current = false;
            accessRef.current = "viewer";

            setSynced(false);
            setAccess("viewer");
            setRemoteUsers([]);
            setRemoteCursors([]);

            onAccessChange?.("viewer");
            onOnlineUsersChange?.([]);
            onSaveStatusChange?.("saved");
        };

        // Connect and join
        const handleConnect = () => {
            if (!isActive || joined) return;

            joined = true;
            syncedRef.current = false;

            setSynced(false);
            setSyncError(null);

            joinDocument(documentId);
        };

        // Register listeners before joining
        ydoc.on("update", handleLocalUpdate);
        awareness.on("update", handleLocalAwareness);

        socket.on("yjsSync", handleYjsSync);
        socket.on("yjsUpdate", handleRemoteUpdate);
        socket.on("awarenessUpdate", handleRemoteAwareness);
        socket.on("onlineUsers", handleOnlineUsers);
        socket.on("accessRevoked", handleAccessRevoked);
        socket.on("joinError", handleJoinError);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        if (socket.connected) {
            handleConnect();
        }

        // Set current user's awareness information
        awareness.setLocalStateField("user", {
            id: user?.id || user?._id,
            name: user?.name || "Anonymous",
            color: getColorForString(user?.name || "user"),
        });

        return () => {
            isActive = false;

            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }

            if (joined) {
                leaveDocument(documentId);
            }

            ydoc.off("update", handleLocalUpdate);
            awareness.off("update", handleLocalAwareness);

            socket.off("yjsSync", handleYjsSync);
            socket.off("yjsUpdate", handleRemoteUpdate);
            socket.off("awarenessUpdate", handleRemoteAwareness);
            socket.off("onlineUsers", handleOnlineUsers);
            socket.off("accessRevoked", handleAccessRevoked);
            socket.off("joinError", handleJoinError);
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);

            awareness.setLocalState(null);
        };
    }, [
        documentId,
        ydoc,
        awareness,
        user,
        onAccessChange,
        onOnlineUsersChange,
        onSaveStatusChange,
    ]);

    // Update editor permissions
    const canEdit =
        synced &&
        (access === "owner" || access === "editor");

    useEffect(() => {
        if (!editor || editor.isDestroyed) return;

        editor.setEditable(canEdit);
    }, [editor, canEdit]);

    // Track text selection
    useEffect(() => {
        if (!editor) return;

        const handleSelectionUpdate = () => {
            const { from, to } = editor.state.selection;

            awareness.setLocalStateField("cursor", {
                from,
                to,
            });

            if (from !== to) {
                const selectedText = editor.state.doc.textBetween(
                    from,
                    to,
                    " "
                );

                onTextSelectionChange?.({
                    start: from,
                    end: to,
                    selectedText,
                });
            } else {
                onTextSelectionChange?.(null);
            }
        };

        editor.on("selectionUpdate", handleSelectionUpdate);

        return () => {
            editor.off("selectionUpdate", handleSelectionUpdate);
        };
    }, [editor, awareness, onTextSelectionChange]);

    // Calculate remote cursor positions
    useEffect(() => {
        if (!editor || !editorContainerRef.current) return;

        const containerRect =
            editorContainerRef.current.getBoundingClientRect();

        const cursors = [];

        remoteUsers.forEach((remote) => {
            if (
                !remote.cursor ||
                remote.cursor.from === undefined
            ) {
                return;
            }

            try {
                const coords = editor.view.coordsAtPos(
                    remote.cursor.from
                );

                if (coords) {
                    cursors.push({
                        clientId: remote.clientId,
                        name: remote.user?.name || "Peer",
                        colorClass:
                            remote.user?.color ||
                            "bg-violet-600 text-white",
                        x: coords.left - containerRect.left,
                        y: coords.top - containerRect.top,
                    });
                }
            } catch {
                // Ignore temporarily invalid positions
            }
        });

        setRemoteCursors(cursors);
    }, [editor, remoteUsers]);

    if (accessRevokedMessage) {
        return (
            <div className="p-12 text-center max-w-md mx-auto my-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Pilcrow size={24} />
                </div>

                <h3 className="text-base font-bold text-stone-900">
                    Access Revoked
                </h3>

                <p className="text-xs text-stone-500">
                    {accessRevokedMessage}
                </p>
            </div>
        );
    }

    if (!editor || !synced) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-xs text-stone-400">
                {syncError ? (
                    <>
                        <p className="text-rose-500">{syncError}</p>
                        <p>Please reopen the document.</p>
                    </>
                ) : (
                    <p>Synchronizing document...</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden relative">

            {/* Formatting Toolbar */}
            <div className="h-10 border-b border-stone-200/80 px-6 flex items-center justify-between shrink-0 bg-stone-50/60 sticky top-0 z-10 select-none">

                <div className="flex items-center gap-1 overflow-x-auto text-stone-600">

                    <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
                            editor.isActive("paragraph")
                                ? "bg-stone-200 text-stone-900 font-bold"
                                : ""
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
                            editor.isActive("heading", { level: 1 })
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
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
                            editor.isActive("heading", { level: 2 })
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
                        }`}
                        title="Heading 2"
                    >
                        <Heading2 size={14} />
                    </button>

                    <div className="h-4 w-px bg-stone-200 mx-1" />

                    <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
                            editor.isActive("bold")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
                        }`}
                        title="Bold"
                    >
                        <Bold size={14} />
                    </button>

                    <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
                            editor.isActive("italic")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
                        }`}
                        title="Italic"
                    >
                        <Italic size={14} />
                    </button>

                    <div className="h-4 w-px bg-stone-200 mx-1" />

                    <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
                            editor.isActive("bulletList")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
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
                            editor.isActive("orderedList")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
                        }`}
                        title="Numbered list"
                    >
                        <ListOrdered size={14} />
                    </button>

                    <div className="h-4 w-px bg-stone-200 mx-1" />

                    <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        className={`p-1.5 rounded hover:bg-stone-200 transition cursor-pointer ${
                            editor.isActive("blockquote")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
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
                            editor.isActive("codeBlock")
                                ? "bg-stone-200 text-violet-700 font-bold"
                                : ""
                        }`}
                        title="Code block"
                    >
                        <Code size={14} />
                    </button>
                </div>

                {!canEdit && (
                    <span className="text-[11px] bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded border border-amber-200">
                        Read-only mode (Viewer access)
                    </span>
                )}
            </div>

            {/* Editor Canvas */}
            <div
                ref={editorContainerRef}
                className="flex-1 overflow-y-auto relative bg-white"
            >
                {remoteCursors.map((cursor) => (
                    <div
                        key={cursor.clientId}
                        className="absolute pointer-events-none z-20 transition-all duration-75"
                        style={{
                            left: `${cursor.x}px`,
                            top: `${cursor.y}px`,
                        }}
                    >
                        <div className="w-[2px] h-4.5 bg-violet-600" />

                        <div className="absolute -top-4 left-0 text-[10px] bg-violet-600 text-white font-semibold px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap">
                            {cursor.name}
                        </div>
                    </div>
                ))}

                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default CollaborativeEditor;
