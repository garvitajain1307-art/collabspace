import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect, useState } from "react";
import socket, { joinDocument } from "../../socket";
import {Awareness,encodeAwarenessUpdate, applyAwarenessUpdate} from "y-protocols/awareness";

const CollaborativeEditor = ({ documentId, user }) => {

    const [ydoc] = useState(() => new Y.Doc());
    const [awareness] = useState(() => new Awareness(ydoc));
    const [synced, setSynced] = useState(false);


    // Yjs + Socket.IO
    useEffect(() => {

        const handleUpdate = (update, origin) => {

            // Don't send remote updates back to server
            if (origin === "remote") {
                return;
            }

            console.log("YJS UPDATE:", update);

            socket.emit("yjsUpdate", {
                update: Array.from(update)
            });
        };


        const handleRemoteUpdate = (data) => {

            console.log("REMOTE YJS UPDATE:", data);

            const update = new Uint8Array(data.update);

            Y.applyUpdate(ydoc, update, "remote");
        };


        const handleYjsSync = (data) => {

            console.log("YJS SYNC RECEIVED:", data);

            const update = new Uint8Array(data.update);

            Y.applyUpdate(ydoc, update, "remote");

            // Initial server state has now arrived
            setSynced(true);
        };

        const handleAwarenessUpdate = ({ added, updated, removed }, origin) => {
          // Don't send remote awareness updates back again
          if (origin === "remote") {
            return;
          }

          const changedClients = added.concat(updated, removed);

          const update = encodeAwarenessUpdate(awareness, changedClients);

          socket.emit("awarenessUpdate", {
            update: Array.from(update),
          });

          console.log("AWARENESS UPDATE SENT:", changedClients);
        };

        awareness.on("update", handleAwarenessUpdate);

        ydoc.on("update", handleUpdate);

        socket.on("yjsUpdate", handleRemoteUpdate);
        socket.on("yjsSync", handleYjsSync);

        const handleRemoteAwarenessUpdate = (data) => {
          console.log("REMOTE AWARENESS UPDATE RECEIVED:", data);

          const update = new Uint8Array(data.update);

          applyAwarenessUpdate(awareness, update, "remote");
        };

        socket.on("awarenessUpdate", handleRemoteAwarenessUpdate);


        if (documentId) {
            joinDocument(documentId);
        }

        awareness.setLocalStateField("user", {
            name: user?.name
        });


        return () => {
            awareness.off("update", handleAwarenessUpdate);

            ydoc.off("update", handleUpdate);

            socket.off("yjsUpdate", handleRemoteUpdate);
            socket.off("yjsSync", handleYjsSync);
            socket.off("awarenessUpdate", handleRemoteAwarenessUpdate);

        };

    }, [ydoc, awareness, documentId]);


    // Create TipTap editor
    const editor = useEditor({

        extensions: [

            StarterKit.configure({
                undoRedo: false
            }),

            Collaboration.configure({
                document: ydoc
            })

        ],

        // Don't allow editing until initial Yjs state arrives
        editable: synced,

        onCreate: () => {
            console.log("EDITOR CREATED");
        }

    });


    // Create initial document only AFTER Yjs sync
    useEffect(() => {

        if (!editor || !synced) {
            return;
        }

        const fragment = ydoc.getXmlFragment("default");

        console.log(
            "FRAGMENT AFTER SYNC:",
            fragment.toJSON()
        );


        // Only create default content for a completely empty document
        if (fragment.length === 0) {

            editor.commands.setContent(`

                <h1>Project Plan</h1>

                <h2>Project Overview</h2>

                <p>
                    This document contains the shared project plan for the team.
                </p>

                <h2>Goals</h2>

                <ul>

                    <li>
                        Build a real-time collaborative workspace
                    </li>

                    <li>
                        Support comments and suggestions
                    </li>

                    <li>
                        Maintain document history
                    </li>

                    <li>
                        Enable AI-assisted editing
                    </li>

                </ul>

                <h2>Milestones</h2>

                <ol>

                    <li>
                        Collaborative editor
                    </li>

                    <li>
                        Comments and suggestions
                    </li>

                    <li>
                        Version history
                    </li>

                    <li>
                        AI assistance
                    </li>

                </ol>

            `);

        }

        // Make editor editable after initialization
        editor.setEditable(true);

    }, [editor, synced]);


    if (!editor) {
        return null;
    }


    return (
        <div>

            {/* Editor toolbar */}

            <div>

                <button
                    onClick={() =>
                        editor.chain().focus().toggleBold().run()
                    }
                >
                    Bold
                </button>


                <button
                    onClick={() =>
                        editor.chain().focus().toggleItalic().run()
                    }
                >
                    Italic
                </button>


                <button
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    Bullet List
                </button>


                <button
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    Numbered List
                </button>

            </div>


            {/* Collaborative editor */}

            <EditorContent editor={editor} />

        </div>
    );
};

export default CollaborativeEditor;