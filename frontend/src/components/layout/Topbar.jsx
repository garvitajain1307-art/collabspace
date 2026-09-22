import {
    Search,
    Bell,
    HelpCircle,
} from "lucide-react";

import "./Topbar.css";
import { useSelector } from "react-redux";

const Topbar = () => {
    const {user} = useSelector((state) => state.auth);

    return (
        <header className="topbar">

            {/* Left side */}
            <div className="topbar-left">

                {/* Page title */}
                <div className="topbar-title">
                    Dashboard
                </div>

            </div>


            {/* Right side */}
            <div className="topbar-right">

                {/* Search */}
                <div className="topbar-search">

                    <Search
                        size={17}
                        strokeWidth={1.8}
                    />

                    <input
                        type="text"
                        placeholder="Search..."
                    />

                    

                </div>


                


                {/* Notification button */}
                <button className="topbar-icon-button notification-button">

                    <Bell
                        size={18}
                        strokeWidth={1.8}
                    />

                    {/* Notification indicator */}
                    <span className="notification-dot"></span>

                </button>


                {/* Divider */}
                <div className="topbar-divider"></div>


                {/* User profile */}
                <button className="topbar-profile">

                    <div className="topbar-avatar">
                        {user?.name?.split(" ").map((word)=>word[0]).join("").slice(0,2).toUpperCase()}
                    </div>

                    <div className="topbar-user-info">

                        <span className="topbar-user-name">
                            {user?.name}
                        </span>

                        <span className="topbar-user-role">
                            {user?.email}
                        </span>

                    </div>

                </button>

            </div>

        </header>
    );
};

export default Topbar;