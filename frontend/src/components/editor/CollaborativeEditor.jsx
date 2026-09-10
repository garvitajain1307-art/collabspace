import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
import { useEffect, useState } from "react";
import socket from "../../socket";

const CollaborativeEditor = () => {

    // Create Y.Doc only once for this editor instance
    const [ydoc] = useState(() => new Y.Doc());

    console.log("YDOC:", ydoc);


    // Listen for Yjs changes and receive remote updates
    useEffect(() => {

        // Local Yjs update
        const handleUpdate = (update, origin) => {

            // Don't send remote updates back to the server
            if (origin === "remote") {
                return;
            }

            console.log("YJS UPDATE:", update);

            socket.emit("yjsUpdate", {
                update: Array.from(update)
            });
        };


        // Remote Yjs update received from server
        const handleRemoteUpdate = (data) => {

            console.log("REMOTE YJS UPDATE:", data);

            const update = new Uint8Array(data.update);

            // Apply the update to this browser's Y.Doc
            // "remote" marks the origin so handleUpdate
            // doesn't send it back to the server
            Y.applyUpdate(ydoc, update, "remote");
        };


        // Start listening for Yjs changes
        ydoc.on("update", handleUpdate);

        // Listen for updates from other users
        socket.on("yjsUpdate", handleRemoteUpdate);


        // Cleanup listeners when component unmounts
        return () => {

            ydoc.off("update", handleUpdate);

            socket.off("yjsUpdate", handleRemoteUpdate);

        };

    }, [ydoc]);


    const editor = useEditor({

        extensions: [

            // Disable TipTap's normal undo/redo.
            // Collaboration/Yjs handles history.
            StarterKit.configure({
                undoRedo: false
            }),


            // Connect TipTap with Y.Doc
            Collaboration.configure({
                document: ydoc
            })

        ],


        // Runs after TipTap editor has been created
        onCreate: ({ editor }) => {

            // Get the Yjs XML fragment used by TipTap
            const fragment = ydoc.getXmlFragment("default");


            // Only add initial content if the document
            // does not already contain anything
            if (fragment.length === 0) {

                editor.commands.setContent(`
                    <h1>Project Plan</h1>

                    <h2>Project Overview</h2>

                    <p>
                        This document contains the shared project plan for the team.
                    </p>

                    <h2>Goals</h2>

                    <ul>
                        <li>Build a real-time collaborative workspace</li>
                        <li>Support comments and suggestions</li>
                        <li>Maintain document history</li>
                        <li>Enable AI-assisted editing</li>
                    </ul>

                    <h2>Milestones</h2>

                    <ol>
                        <li>Collaborative editor</li>
                        <li>Comments and suggestions</li>
                        <li>Version history</li>
                        <li>AI assistance</li>
                    </ol>
                `);

            }

        }

    });


    // Editor has not been created yet
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