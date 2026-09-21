import Sidebar from "../../components/layout/Sidebar";

const Dashboard = () => {
    return (
        <div className="dashboard-page">

            {/* 
                Sidebar belongs to the dashboard/application layout.
                Later, the main dashboard content will be placed
                beside this sidebar.
            */}
            <Sidebar />

            {/* 
                Temporary main content.
                We will replace this with the actual Dashboard UI
                component-by-component.
            */}
            <main className="dashboard-content">
                <h1>Dashboard</h1>
            </main>

        </div>
    );
};

export default Dashboard;