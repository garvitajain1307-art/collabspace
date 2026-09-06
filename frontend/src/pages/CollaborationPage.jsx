import { useEffect,useState } from "react";
import socket from "../socket";
import "./CollaborationPage.css";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";

const CollaborationPage = () => {
    const [cursors, setCursors] = useState({});

    useEffect(() => {

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

    }, []);
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
            <CollaborativeEditor />
        </div>
    )

}

export default CollaborationPage;