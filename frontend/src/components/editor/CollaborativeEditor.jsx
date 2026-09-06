import {useEditor,EditorContent} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";;

const CollaborativeEditor=()=>{

    const editor=useEditor({
        extensions:[
            StarterKit,
        ],

        content:`
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
        `
    });

    if(!editor){
        return null;
    }

    return(
        <div>
            <div>
                <button onClick={()=>editor.chain().focus().toggleBold().run()}>Bold</button>
                <button onClick={()=>editor.chain().focus().toggleItalic().run()}>Italic</button>
                <button onClick={()=>editor.chain().focus().toggleBulletList().run()}>Bullet List</button>
                <button onClick={()=>editor.chain().focus().toggleOrderedList().run()}>Numbered List</button>
            </div>

            <EditorContent editor={editor}/>
        </div>
    )

}

export default CollaborativeEditor;