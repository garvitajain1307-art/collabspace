import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
// import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useEffect, useState } from "react";
import socket, { joinDocument } from "../../socket";
import {Awareness,encodeAwarenessUpdate, applyAwarenessUpdate} from "y-protocols/awareness";


const CollaborativeEditor = ({ documentId, user }) => {

    const [ydoc] = useState(() => new Y.Doc());
    const [awareness] = useState(() => new Awareness(ydoc));
    const [synced, setSynced] = useState(false);
    const [access, setAccess] = useState("viewer");
    const [remoteUsers, setRemoteUsers] = useState([]);
    const [remoteCursors, setRemoteCursors] = useState([]);


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
            setAccess(data.access);

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

          console.log("REMOTE AWARENESS UPDATE RECEIVED:", data);

          // Get all Awareness states
          const states = awareness.getStates();

          console.log("ALL AWARENESS STATES:", Array.from(states.entries()));

          // Convert the Map into an array
          const users = Array.from(states.entries())
            .filter(([clientId]) => {
                return clientId !== awareness.clientID;
            })
            .map(
            ([clientId, state]) => ({
              clientId: clientId,
              ...state,
            }),
          );

          // Store the Awareness states in React
          setRemoteUsers(users);

        //   const states = awareness.getStates();

          
        };;

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

    useEffect(() => {
        console.log("REMOTE USERS STATE:", remoteUsers);
    }, [remoteUsers]);

    

    // Create TipTap editor
    const editor = useEditor({

        extensions: [

            StarterKit.configure({
                undoRedo: false
            }),

            Collaboration.configure({
                document: ydoc
            }),

            // CollaborationCaret.configure({
            //     awareness: awareness,
            //     user:{name:user?.name || "Anonymous"}
            // })

        ],

        // Don't allow editing until initial Yjs state arrives
        editable:synced &&(access === "owner" || access === "editor"),

        onCreate: () => {
            console.log("EDITOR CREATED");
        }

    });

    useEffect(() => {
      
      if (!editor) {
        return;
      }

      
      const canEdit = access === "owner" || access === "editor";

      // Tell Tiptap whether editing is allowed.
      editor.setEditable(canEdit);
    }, [editor, access]);
    

    useEffect(() => {
      
      if (!editor) {
        return;
      }

      // Check every remote user's cursor
      remoteUsers.forEach((remoteUser) => {
        // Make sure this user actually has cursor information
        if (!remoteUser.cursor) {
          return;
        }

        const { from } = remoteUser.cursor;

        // Convert the Tiptap document position into a position in the actual editor DOM
        const coords = editor.view.coordsAtPos(from);

        console.log("REMOTE CURSOR:",remoteUser.user?.name,"X:",coords.left,"Y:",coords.top);
      });
    }, [editor, remoteUsers]);

    useEffect(() => {
      // Don't do anything until the editor exists
      if (!editor) {
        return;
      }

      const cursors = [];

      // Check every remote user
      remoteUsers.forEach((remoteUser) => {
        // Ignore users who don't currently have cursor data
        if (!remoteUser.cursor) {
          return;
        }

        const { from } = remoteUser.cursor;

        // Convert Tiptap document position to screen coordinates
        const coords = editor.view.coordsAtPos(from);

        // Store the information needed to draw the cursor
        cursors.push({
          clientId: remoteUser.clientId,
          name: remoteUser.user?.name,
          x: coords.left,
          y: coords.top,
        });
      });

      // Update React state
      setRemoteCursors(cursors);
    }, [editor, remoteUsers]);


    useEffect(() => {
      
      if (!editor) {
        return;
      }

      //runs whenever the cursor/selection changes
      const handleSelectionUpdate = () => {
        const { from, to } = editor.state.selection;

        // Store the cursor/selection position
        // inside the local Awareness state
        awareness.setLocalStateField("cursor", {
          from: from,
          to: to,
        });

        console.log("MY AWARENESS STATE:", awareness.getLocalState());
      };


      
      editor.on("selectionUpdate", handleSelectionUpdate);

      
      return () => {
        editor.off("selectionUpdate", handleSelectionUpdate);
      };
    }, [editor, awareness]);


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

    }, [editor, synced]);


    if (!editor) {
        return null;
    }


   return (
     <div>
       {/* Editor toolbar */}
       <div>
         <button onClick={() => editor.chain().focus().toggleBold().run()}>
           Bold
         </button>

         <button onClick={() => editor.chain().focus().toggleItalic().run()}>
           Italic
         </button>

         <button
           onClick={() => editor.chain().focus().toggleBulletList().run()}
         >
           Bullet List
         </button>

         <button
           onClick={() => editor.chain().focus().toggleOrderedList().run()}
         >
           Numbered List
         </button>
       </div>

       {/* Remote users' cursors */}
       {remoteCursors.map((cursor) => (
         <div
           key={cursor.clientId}
           className="remote-cursor"
           style={{
             left: `${cursor.x}px`,
             top: `${cursor.y}px`,
           }}
         >
           {/* Vertical line showing the remote cursor */}
           <div className="remote-cursor-line"></div>

           {/* Remote user's name */}
           <div className="remote-cursor-name">{cursor.name}</div>
         </div>
       ))}

       {/* Collaborative editor */}
       <EditorContent editor={editor} />
     </div>
   );
};

export default CollaborativeEditor;