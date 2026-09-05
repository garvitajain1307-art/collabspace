import { useEffect,useState } from "react";
import socket from "../socket";
import "./CollaborationPage.css";

const CollaborationPage = () => {
    const [cursors, setCursors] = useState({});

    useEffect(() => {

        const handleCursorMove = (data) => {

            setCursors((prev) => ({
                ...prev,
                [data.userId]: data
            }));

        };

        socket.on("cursorMove", handleCursorMove);

        return () => {
            socket.off("cursorMove", handleCursorMove);
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
        </div>
    )

}

export default CollaborationPage;