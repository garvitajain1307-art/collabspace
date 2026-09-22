import Sidebar from "../../components/layout/Sidebar";
import Topbar from "../../components/layout/Topbar";
import DashboardContent from "../../components/dashboard/DashboardContent";
import "./Dashboard.css";

const Dashboard = () => {
    return (
        <div className="dashboard-page">

            <Sidebar />

            
            <main className="dashboard-content">
                <Topbar />
                <DashboardContent />
                
            </main>

        </div>
    );
};

export default Dashboard;