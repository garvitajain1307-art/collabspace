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

import "./Sidebar.css";

const Sidebar = () => {

    const {user}=useSelector((state)=>state.auth);


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


    // --------------------------------------------------
    // STATIC WORKSPACE DATA
    // Later this will come from workspaceSlice/API.
    // --------------------------------------------------
    const workspaces = [
        {
            name: "CollabSpace Team",
            initial: "C",
        },
        {
            name: "Product Development",
            initial: "P",
        },
        {
            name: "College Projects",
            initial: "C",
        },
    ];


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
                <div className="workspace-list">

                    {workspaces.map((workspace) => (

                        <button
                            key={workspace.name}
                            className="workspace-item"
                        >

                            {/* Workspace initial/icon */}
                            <span className="workspace-icon">
                                {workspace.initial}
                            </span>

                            {/* Workspace name */}
                            <span className="workspace-name">
                                {workspace.name}
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