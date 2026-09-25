import {
    LayoutDashboard,
    FileText,
    Clock3,
    Users,
    Plus,
    Settings,
    ChevronDown,
} from "lucide-react";

import {useSelector} from "react-redux";
import {useEffect} from "react";
import {useDispatch} from "react-redux";
import {useNavigate} from "react-router-dom";
import {setWorkspaces, setSelectedWorkspace, clearSelectedWorkspace, setLoading, setError, clearError} from "../../features/workspace/workspaceSlice";

import "./Sidebar.css";

const Sidebar = () => {

    const dispatch=useDispatch();

    const {user}=useSelector((state)=>state.auth);
    const {workspaces,loading,error}=useSelector((state)=>state.workspace);
    const navigate=useNavigate();


    // --------------------------------------------------
    // STATIC NAVIGATION DATA
    // Later these can be connected to React Router.
    // --------------------------------------------------
    const navigationItems = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            active: true,
        },
        {
            label: "My Documents",
            icon: FileText,
            active: false,
        },
        {
            label: "Recent",
            icon: Clock3,
            active: false,
        },
        {
            label: "Shared with me",
            icon: Users,
            active: false,
        },
    ];

    useEffect(()=>{
        const fetchWorkspaces=async()=>{
            dispatch(setLoading());
            try{
                const res=await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/v1/workspace/getMyWorkspaces`,
                    {
                    credentials:"include"
                }
                );

                const data=await res.json();
                if(data.success){
                    dispatch(setWorkspaces(data.workspaces));
                }else{
                    dispatch(setError(data.message));
                }
            }catch(err){
                console.log(err);
                dispatch(setError("Failed to fetch workspaces"));
            }

        }
        fetchWorkspaces();
    },[dispatch])


   


    return (
        <aside className="sidebar">


            <div className="sidebar-header">

                {/* Small CollabSpace logo */}
                <div className="sidebar-logo">
                    #
                </div>

                {/* Application name */}
                <span className="sidebar-brand">
                    CollabSpace
                </span>

            </div>


            <nav className="sidebar-navigation">

                {navigationItems.map((item) => {

                    // Store the icon component in a variable.
                    // This allows us to render different icons
                    // from the same navigation array.
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.label}
                            className={`sidebar-nav-item ${
                                item.active ? "active" : ""
                            }`}
                        >

                            {/* Navigation icon */}
                            <Icon
                                size={17}
                                strokeWidth={1.8}
                            />

                            {/* Navigation text */}
                            <span>{item.label}</span>

                        </button>
                    );
                })}

            </nav>


            

            <div className="sidebar-section">

                {/* Section heading */}
                <div className="sidebar-section-title">
                    WORKSPACES
                </div>


                {/* Workspace list */}
                <div className="workspace-list" >

                    {workspaces.map((workspace) => (

                        <button
                            key={workspace._id}
                            className="workspace-item"
                            onClick={() => {navigate(`/workspace/${workspace._id}`);}}
                             
                        >

                            {/* Workspace initial/icon */}
                            <span className="workspace-icon">
                                {workspace?.name?.split(" ").map((word)=>word[0]).join("").slice(0,1).toUpperCase()}
                            </span>

                            {/* Workspace name */}
                            <span className="workspace-name">
                                {workspace?.name}
                            </span>

                        </button>

                    ))}

                </div>


                {/* Add workspace button */}
                <button className="add-workspace-button">

                    <Plus
                        size={16}
                        strokeWidth={1.8}
                    />

                    <span>
                        Add workspace
                    </span>

                </button>

            </div>


           

            <div className="sidebar-bottom">

                {/* Settings */}
                <button className="sidebar-settings">

                    <Settings
                        size={17}
                        strokeWidth={1.8}
                    />

                    <span>
                        Settings
                    </span>

                </button>


                

                <div className="sidebar-user">

                    {/* User initials */}
                    <div className="user-avatar">
                        {user?.name?.split(" ").map((word)=>word[0]).join("").slice(0,2).toUpperCase()}
                    </div>


                    {/* User information */}
                    <div className="user-information">

                        <div className="user-name">
                            {user?.name}
                        </div>

                        <div className="user-email">
                            {user?.email}
                        </div>

                    </div>


                    {/* Dropdown icon */}
                    <ChevronDown
                        className="user-dropdown-icon"
                        size={15}
                        strokeWidth={1.8}
                    />

                </div>

            </div>

        </aside>
    );
};

export default Sidebar;