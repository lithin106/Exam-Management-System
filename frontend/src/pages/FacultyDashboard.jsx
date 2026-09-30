import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function FacultyDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(
        localStorage.getItem("user")
    );

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="dashboard">
            <header className="topbar">
                <div className="topbar-brand">
                    <div>
                        <h1>Exam Management System</h1>
                        <span className="portal-tag">Faculty Portal</span>
                    </div>
                </div>

                <div className="topbar-nav">
                    <ThemeToggle />
                    <div className="profile-pill">
                        <span>{user?.name || "Faculty"}</span>
                    </div>

                    <button className="btn-nav-logout" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h2 className="page-title">Faculty Dashboard</h2>
                        <p className="page-subtitle">
                            Examination and Seating Management System
                        </p>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h3>Student Management</h3>
                        <p>
                            Upload student records via Excel or PDF and view enrolled candidates.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/faculty/students")}
                        >
                            Manage Students
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Examination Rooms</h3>
                        <p>
                            Configure exam halls, manage row and column dimensions, and view usable seating capacities.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/faculty/rooms")}
                        >
                            Manage Rooms
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Examinations</h3>
                        <p>
                            Create exam schedules, select examination halls, and configure session timings.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/faculty/exams")}
                        >
                            Manage Exams
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Faculty Allocation</h3>
                        <p>
                            Assign faculty invigilators to examination rooms, validate faculty counts, and generate allocation sheets.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/faculty/allocation")}
                        >
                            Allocate Faculty
                        </button>
                    </div>

                    <div className="dashboard-card">
                        <h3>Seating Arrangement</h3>
                        <p>
                            Generate column-wise seating allocations, export Seating Plan PDFs, and generate Notice Board sheets.
                        </p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate("/faculty/seating")}
                        >
                            Generate Seating
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default FacultyDashboard;