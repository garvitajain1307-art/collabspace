import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import "./CollaborationPage.css";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";
import { useSelector } from "react-redux";


const CollaborationPage = () => {
    const [cursors, setCursors] = useState({});
    const { user } = useSelector((state) => state.auth);
    const { documentId } = useParams();

    console.log("DOCUMENT ID:", documentId);

    useEffect(() => {
       
         console.log("EFFECT RUNNING");
         console.log("DOCUMENT ID INSIDE EFFECT:", documentId);

         if (!documentId) {
           console.log("NO DOCUMENT ID");
           return;
         }

         console.log("ABOUT TO CALL JOIN DOCUMENT");

        
         console.log("JOIN DOCUMENT FUNCTION CALLED");

        

        const handleCursorMove = (data) => {

            setCursors((prev) => ({
                ...prev,
                [data.userId]: data
            }));

        };

        const handlerUserLeft = (data)=>{
            setCursors((prev)=>{
                const updated={...prev};
                delete updated[data.userId];
                return updated;
            })
        }

        socket.on("cursorMove", handleCursorMove);
        socket.on("userLeft",handlerUserLeft);

        

        return () => {
            socket.off("cursorMove", handleCursorMove);
            socket.off("userLeft",handlerUserLeft);
        };

    }, [documentId]);
    return(
        <div className="collaboration-page">
            <h2>CollabSpace - Collaboration Test</h2>
            {Object.values(cursors).map((cursor) => (

                <div
                    key={cursor.userId}
                    className="remote-cursor"
                    style={{
                        left: `${cursor.x}px`,
                        top: `${cursor.y}px`
                    }}
                >

                    <div className="cursor-icon">
                        🖱️
                    </div>

                    <div className="cursor-name">
                        {cursor.name}
                    </div>

                </div>

            ))}
            <CollaborativeEditor documentId={documentId}  user={user}/>
        </div>
    )

}

export default CollaborationPage;