import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";
import "./CollaborationPage.css";
import CollaborativeEditor from "../components/editor/CollaborativeEditor";
import { useSelector } from "react-redux";


const CollaborationPage = () => {
    
    const { user } = useSelector((state) => state.auth);
    const { documentId } = useParams();

    console.log("DOCUMENT ID:", documentId);

   
    return(
        <div className="collaboration-page">
            <h2>CollabSpace - Collaboration Test</h2>
           
            <CollaborativeEditor documentId={documentId}  user={user}/>
        </div>
    )

}

export default CollaborationPage;