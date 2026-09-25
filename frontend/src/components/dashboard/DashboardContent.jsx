import {
    ArrowUpRight,
    FileText,
    Clock3,
    MoreHorizontal,
    Folder,
    Users
} from "lucide-react";

import "./DashboardContent.css";
import { useSelector } from "react-redux";
import {useNavigate} from "react-router-dom";
import { setSelectedWorkspace } from "../../features/workspace/workspaceSlice";
import { useDispatch } from "react-redux";


const DashboardContent = () => {
    const {user}=useSelector((state)=>state.auth);
    const {workspaces}=useSelector((state)=>state.workspace);
    const navigate = useNavigate();
    const dispatch=useDispatch()

    return (
      <div className="dashboard-main-content">
        <section className="dashboard-welcome">
          <div>
            {/* <p className="dashboard-greeting">
                        Good morning, 
                    </p> */}

            <h1>Welcome back, {user?.name?.split(" ")[0]}</h1>

            <p className="dashboard-subtitle">
              Continue your work and collaborate with your team.
            </p>
          </div>

          {/* Create button */}
          <button className="dashboard-create-button">
            + Create workspace
          </button>
        </section>

        {/* --------------------------------------------------
                WORKSPACE SECTION
            -------------------------------------------------- */}

        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <div>
              <h2>Workspaces</h2>
              <p>Your collaborative spaces</p>
            </div>

            <button className="dashboard-view-all">
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="workspace-card-grid">
            {workspaces.map((workspace) => (
              <div className="dashboard-workspace-card" key={workspace._id} onClick={() =>  {dispatch(setSelectedWorkspace(workspace)); navigate(`/workspace/${workspace._id}`);}}>
                <div className="workspace-card-top">
                  <div className="dashboard-workspace-icon">
                    {workspace?.name?.split(" ").map((word)=>word[0]).join("").slice(0,1).toUpperCase()}
                  </div>

                  <button className="workspace-more-button" onClick={(event)=>{event.stopPropagation()}}>
                    <MoreHorizontal size={17} />
                  </button>
                </div>

                <h3>{workspace?.name}</h3>

                <p>{workspace?.description}</p>

                <div className="workspace-card-footer">
                  <span>
                    <FileText size={13} />
                    {workspace.documents?.length || 0} documents
                  </span>

                  <span>
                    <Users size={13} />
                    {workspace.members?.length || 0} members
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------------------------
                LOWER SECTION
            -------------------------------------------------- */}

        <div className="dashboard-lower-grid">
          {/* --------------------------------------------------
                    RECENT DOCUMENTS
                -------------------------------------------------- */}

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Recent Documents</h2>
                <p>Documents you recently worked on</p>
              </div>

              <button className="dashboard-view-all">
                View all
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="recent-document-list">
              <div className="recent-document">
                <div className="document-icon">
                  <FileText size={16} />
                </div>

                <div className="document-information">
                  <span className="document-name">Project Requirements</span>

                  <span className="document-meta">
                    CollabSpace Team · Edited 10 min ago
                  </span>
                </div>

                <button className="document-more">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="recent-document">
                <div className="document-icon">
                  <FileText size={16} />
                </div>

                <div className="document-information">
                  <span className="document-name">Product Roadmap</span>

                  <span className="document-meta">
                    Product Development · Edited 1 hour ago
                  </span>
                </div>

                <button className="document-more">
                  <MoreHorizontal size={16} />
                </button>
              </div>

              <div className="recent-document">
                <div className="document-icon">
                  <FileText size={16} />
                </div>

                <div className="document-information">
                  <span className="document-name">Project Notes</span>

                  <span className="document-meta">
                    College Projects · Edited yesterday
                  </span>
                </div>

                <button className="document-more">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          </section>

          {/* --------------------------------------------------
                    RECENT ACTIVITY
                -------------------------------------------------- */}

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <h2>Recent Activity</h2>
                <p>Latest activity across your workspaces</p>
              </div>

              <button className="dashboard-view-all">
                View all
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-avatar">G</div>

                <div className="activity-information">
                  <p>
                    You edited <strong>Project Requirements</strong>
                  </p>

                  <span>10 minutes ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-avatar">A</div>

                <div className="activity-information">
                  <p>
                    Alex commented on <strong>Product Roadmap</strong>
                  </p>

                  <span>1 hour ago</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-avatar">S</div>

                <div className="activity-information">
                  <p>
                    Sam joined <strong>CollabSpace Team</strong>
                  </p>

                  <span>Yesterday</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
};

export default DashboardContent;