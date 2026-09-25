
import {
    FileText,
    Folder,
    Users,
    Activity,
    Plus,
    Search,
    MoreHorizontal,
    UserPlus,
    Clock3,
    FolderPlus
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";

import "./WorkspaceHome.css";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useDispatch } from "react-redux";

import { useEffect, useState } from "react";

import {
  setSelectedWorkspace,
  
  setError,
} from "../../features/workspace/workspaceSlice";

import {setDocuments,} from "../../features/document/documentSlice";



const WorkspaceHome = () => {

   
    const { workspaceId } = useParams();
    const dispatch=useDispatch();


    const {selectedWorkspace,loading,error}=useSelector((state)=>state.workspace);
    const { documents } = useSelector((state) => state.document);
    const [workspaceLoading, setWorkspaceLoading] = useState(true);
//     useEffect(() => {
// //     console.log("REDUX WORKSPACE STATE:", {
// //         selectedWorkspace,
// //         loading,
// //         error
// //     });
// // }, [selectedWorkspace, loading, error]);
    
    useEffect(() => {
      const fetchWorkspaceData = async () => {
        // Start loading the workspace page.
        setWorkspaceLoading(true);

        try {
         
          const workspaceRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/workspace/getWorkspace/${workspaceId}`,
            {
              credentials: "include",
            },
          );

          const workspaceData = await workspaceRes.json();

          console.log("WORKSPACE RESPONSE:", workspaceData);

          if (workspaceData.success) {
           
            dispatch(setSelectedWorkspace(workspaceData.workspace));
          } else {
            dispatch(setError(workspaceData.message));
          }


          const documentsRes = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/api/v1/document/getWorkspaceDocuments/${workspaceId}`,
            {
              credentials: "include",
            },
          );

          const documentsData = await documentsRes.json();
          console.log("FIRST DOCUMENT:", documentsData.documents[0]);

          console.log("DOCUMENTS RESPONSE:", documentsData);

          if (documentsData.success) {
           
            dispatch(setDocuments(documentsData.documents));
          }
        } catch (error) {
          console.log("Fetch workspace data error:", error);

          dispatch(setError("Failed to fetch workspace data"));
        } finally {
          // Stop loading after API calls finish.
          setWorkspaceLoading(false);
        }
      };

      // Only run the API calls when workspaceId exists.
      if (workspaceId) {
        fetchWorkspaceData();
      }
    }, [workspaceId, dispatch]);

    
    if (workspaceLoading) {
      return <div>Loading workspace...</div>;
    }

   
    if (!selectedWorkspace) {
      return <div>Workspace not found</div>;
    }

   
    const workspace = selectedWorkspace;


    // Temporary folder data.
    const folders = [
        {
            id: "f1",
            name: "Product Documentation",
            documents: 4,
            updated: "2 hours ago"
        },
        {
            id: "f2",
            name: "Meeting Notes",
            documents: 7,
            updated: "Yesterday"
        }
    ];


    


    // Temporary member data.
    const members = [
        {
            id: "m1",
            name: "Garvita",
            initial: "G",
            role: "Owner"
        },
        {
            id: "m2",
            name: "Alex",
            initial: "A",
            role: "Editor"
        },
        {
            id: "m3",
            name: "Priya",
            initial: "P",
            role: "Viewer"
        }
    ];


    // Temporary activity data.
    const activities = [
        {
            id: "a1",
            text: "Alex edited Team Meeting Notes",
            time: "10 min ago",
            initial: "A"
        },
        {
            id: "a2",
            text: "Priya joined the workspace",
            time: "2 hours ago",
            initial: "P"
        },
        {
            id: "a3",
            text: "You created Project Documentation",
            time: "Yesterday",
            initial: "G"
        },
        {
            id: "a4",
            text: "Alex created a new folder",
            time: "Yesterday",
            initial: "A"
        }
    ];




    return (
        <div className="workspace-page">

            {/* Existing sidebar */}
            <Sidebar />


            <main className="workspace-main">

                {/* Existing topbar */}
                <Topbar />


                <div className="workspace-content">


                    {/* =================================
                        WORKSPACE HEADER
                    ================================= */}

                    <section className="workspace-header">

                        <div className="workspace-header-left">

                            {/* Workspace initial */}
                            <div className="workspace-large-avatar">
                                {workspace?.name?.split(" ").map((word)=>word[0]).join("").slice(0,1).toUpperCase()}
                            </div>


                            <div className="workspace-header-info">

                                <div className="workspace-title-row">

                                    <h1>{workspace.name}</h1> 

                                    
                                    <button
                                        className="workspace-more-button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            console.log(
                                                "Workspace menu clicked:",
                                                workspaceId
                                            );
                                        }}
                                    >
                                        <MoreHorizontal size={19} />
                                    </button>

                                </div>


                                <p className="workspace-description">
                                    {workspace.description} 
                                </p>


                                <div className="workspace-meta">

                                    <div className="workspace-owner">

                                        <span className="small-avatar">
                                            {workspace.owner?.name?.charAt(0).toUpperCase()}
                                        </span>

                                        <span>
                                            Owned by {workspace.owner?.name} 
                                        </span>

                                    </div>


                                    <span className="meta-separator">
                                        •
                                    </span>


                                    <div className="workspace-members-count">

                                        <Users size={15} />

                                        <span>
                                            {workspace.members.length || 0} members 
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <button className="invite-button">

                            <UserPlus size={17} />

                            Invite members

                        </button>

                    </section>



                    {/* =================================
                        WORKSPACE TABS
                    ================================= */}

                    <div className="workspace-tabs">

                        <button className="workspace-tab active">
                            Overview
                        </button>

                        <button className="workspace-tab">
                            <FileText size={15} />
                            Documents
                        </button>

                        <button className="workspace-tab">
                            <Users size={15} />
                            Members
                        </button>

                        <button className="workspace-tab">
                            <Activity size={15} />
                            Activity
                        </button>

                    </div>



                    {/* =================================
                        QUICK STATISTICS
                    ================================= */}

                    <section className="workspace-stats">

                        <div className="stat-card">

                            <div className="stat-icon">
                                <FileText size={18} />
                            </div>

                            <div>
                                <span className="stat-label">
                                    Documents
                                </span>

                                <strong>{documents.length || 0}</strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <Folder size={18} />
                            </div>

                            <div>
                                <span className="stat-label">
                                    Folders
                                </span>

                                <strong>2</strong>
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <Users size={18} />
                            </div>

                            <div>
                                <span className="stat-label">
                                    Members
                                </span>

                                <strong>{workspace.members.length}</strong> 
                            </div>

                        </div>


                        <div className="stat-card">

                            <div className="stat-icon">
                                <Activity size={18} />
                            </div>

                            <div>
                                <span className="stat-label">
                                    Activity
                                </span>

                                <strong>8</strong>
                            </div>

                        </div>

                    </section>



                    {/* =================================
                        MAIN TWO COLUMN AREA
                    ================================= */}

                    <div className="workspace-grid">


                        {/* =================================
                            LEFT COLUMN
                        ================================= */}

                        <section className="documents-section">


                            {/* Section header */}

                            <div className="section-header">

                                <div>
                                    <h2>Documents & Folders</h2>

                                    <p>
                                        Manage your workspace content
                                    </p>
                                </div>


                                <div className="document-actions">

                                    <button className="secondary-action">

                                        <FolderPlus size={16} />

                                        New Folder

                                    </button>


                                    <button className="primary-action">

                                        <Plus size={16} />

                                        New Document

                                    </button>

                                </div>

                            </div>



                            {/* Search */}

                            <div className="document-toolbar">

                                <div className="document-search">

                                    <Search size={16} />

                                    <input
                                        type="text"
                                        placeholder="Search documents and folders..."
                                    />

                                </div>


                                <button className="filter-button">
                                    All
                                </button>

                            </div>



                            {/* Folders */}

                            <div className="content-subsection">

                                <h3>Folders</h3>


                                <div className="folder-list">

                                    {folders.map((folder) => (

                                        <div
                                            className="folder-row"
                                            key={folder.id}
                                        >

                                            <div className="content-item-left">

                                                <div className="folder-icon">
                                                    <Folder size={19} />
                                                </div>


                                                <div>

                                                    <h4>
                                                        {folder.name}
                                                    </h4>

                                                    <span>
                                                        {folder.documents} documents
                                                        {" · "}
                                                        {folder.updated}
                                                    </span>

                                                </div>

                                            </div>


                                            
                                            <button
                                                className="item-more-button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    console.log(
                                                        "Folder menu:",
                                                        folder.id
                                                    );
                                                }}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                        </div>

                                    ))}

                                </div>

                            </div>



                            {/* Documents */}

                            <div className="content-subsection">

                                <h3>Documents</h3>


                                <div className="document-list">

                                    {documents.map((document) => (

                                        <div
                                            className="document-row"
                                            key={document.id}
                                        >

                                            <div className="content-item-left">

                                                <div className="document-icon">
                                                    <FileText size={18} />
                                                </div>


                                                <div>

                                                    <h4>
                                                        {document.title}
                                                    </h4>


                                                    <div className="document-info">

                                                        <span className="tiny-avatar">
                                                           {document.owner?.name?.charAt(0).toUpperCase()}
                                                        </span>

                                                        <span>
                                                            {document.owner?.name} 
                                                        </span>

                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            {new Date(document.updatedAt).toLocaleDateString()}
                                                        </span>

                                                    </div>

                                                </div>

                                            </div>


                                            <button
                                                className="item-more-button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    console.log(
                                                        "Document menu:",
                                                        document.id
                                                    );
                                                }}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        </section>



                        {/* =================================
                            RIGHT COLUMN
                        ================================= */}

                        <aside className="workspace-right-column">


                            {/* =================================
                                RECENT ACTIVITY
                            ================================= */}

                            <section className="side-section">

                                <div className="side-section-header">

                                    <div>
                                        <h2>Recent Activity</h2>
                                        <p>Latest workspace updates</p>
                                    </div>

                                    <button className="view-all-button">
                                        View all
                                    </button>

                                </div>


                                <div className="activity-list">

                                    {activities.map((activity) => (

                                        <div
                                            className="activity-item"
                                            key={activity.id}
                                        >

                                            <div className="activity-avatar">
                                                {activity.initial}
                                            </div>


                                            <div className="activity-content">

                                                <p>
                                                    {activity.text}
                                                </p>

                                                <span>
                                                    <Clock3 size={12} />
                                                    {activity.time}
                                                </span>

                                            </div>

                                        </div>

                                    ))}

                                </div>

                            </section>



                            {/* =================================
                                MEMBERS
                            ================================= */}

                            <section className="side-section">

                                <div className="side-section-header">

                                    <div>
                                        <h2>Members</h2>
                                        <p>Workspace members</p>
                                    </div>

                                    <button className="view-all-button">
                                        View all
                                    </button>

                                </div>


                                <div className="members-list">

                                    {members.map((member) => (

                                        <div
                                            className="member-row"
                                            key={member.id}
                                        >

                                            <div className="member-left">

                                                <div className="member-avatar">
                                                    {member.initial}
                                                </div>


                                                <div>
                                                    <h4>
                                                        {member.name}
                                                    </h4>

                                                    <span>
                                                        {member.role}
                                                    </span>
                                                </div>

                                            </div>

                                        </div>

                                    ))}

                                </div>


                                <button className="invite-small-button">

                                    <UserPlus size={15} />

                                    Invite members

                                </button>

                            </section>

                        </aside>

                    </div>

                </div>

            </main>

        </div>
    );
};


export default WorkspaceHome;