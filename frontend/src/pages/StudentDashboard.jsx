import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function StudentDashboard() {
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    const [profile, setProfile] = useState(null);
    const [seating, setSeating] = useState([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingSeating, setLoadingSeating] = useState(true);
    const [errorProfile, setErrorProfile] = useState("");
    const [errorSeating, setErrorSeating] = useState("");

    useEffect(() => {
        fetchProfile();
        fetchSeating();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoadingProfile(true);
            const response = await API.get("/student-portal/profile");
            setProfile(response.data.student);
        } catch (err) {
            if (err.response?.status === 401) {
                logout();
                return;
            }
            setErrorProfile(
                err.response?.data?.message || "Failed to load profile"
            );
        } finally {
            setLoadingProfile(false);
        }
    };

    const fetchSeating = async () => {
        try {
            setLoadingSeating(true);
            const response = await API.get("/student-portal/seating");
            setSeating(response.data.seating || []);
        } catch (err) {
            if (err.response?.status === 401) return;
            setErrorSeating(
                err.response?.data?.message || "Failed to load seating information"
            );
        } finally {
            setLoadingSeating(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const getStatusBadge = (status) => {
        if (status === "scheduled") return "badge-pill badge-blue";
        if (status === "completed") return "badge-pill badge-emerald";
        return "badge-pill badge-slate";
    };

    const getStatusLabel = (status) => {
        if (status === "scheduled") return "Scheduled";
        if (status === "completed") return "Completed";
        return "Draft";
    };

    return (
        <div className="dashboard">
            <header className="topbar">
                <div className="topbar-brand">
                    <div>
                        <h1>Exam Management System</h1>
                        <span className="portal-tag">Student Portal</span>
                    </div>
                </div>

                <div className="topbar-nav">
                    <ThemeToggle />
                    <div className="profile-pill">
                        <span>{user?.name || "Student"}</span>
                    </div>
                    <button className="btn-nav-logout" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            <main className="dashboard-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h2 className="page-title">
                            Welcome, {profile?.name || user?.name || "Student"}
                        </h2>
                        <p className="page-subtitle">
                            Student Dashboard — View your exam schedule and seating assignments
                        </p>
                    </div>
                </div>

                <div className="student-section">
                    <h3 className="section-title">Student Profile</h3>

                    {loadingProfile ? (
                        <div className="student-loading">
                            <div className="spinner"></div>
                            <span>Loading profile...</span>
                        </div>
                    ) : errorProfile ? (
                        <div className="error-message">{errorProfile}</div>
                    ) : profile ? (
                        <div className="student-profile-grid">
                            <div className="student-profile-item">
                                <span className="profile-label">Full Name</span>
                                <span className="profile-value">{profile.name}</span>
                            </div>
                            <div className="student-profile-item">
                                <span className="profile-label">USN</span>
                                <span className="profile-value profile-usn">{profile.studentId}</span>
                            </div>
                            <div className="student-profile-item">
                                <span className="profile-label">Department</span>
                                <span className="profile-value">{profile.department || "—"}</span>
                            </div>
                            <div className="student-profile-item">
                                <span className="profile-label">Semester</span>
                                <span className="profile-value">{profile.semester || "—"}</span>
                            </div>
                            <div className="student-profile-item">
                                <span className="profile-label">Section</span>
                                <span className="profile-value">{profile.section || "—"}</span>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="student-section">
                    <h3 className="section-title">Seating Information</h3>

                    {loadingSeating ? (
                        <div className="student-loading">
                            <div className="spinner"></div>
                            <span>Loading seating information...</span>
                        </div>
                    ) : errorSeating ? (
                        <div className="error-message">{errorSeating}</div>
                    ) : seating.length === 0 ? (
                        <div className="student-empty-state">
                            <div className="empty-icon">💺</div>
                            <p>No seating assignment available yet</p>
                            <span>Your seating arrangement will appear here once the coordinator generates the seating plan.</span>
                        </div>
                    ) : (
                        <div className="student-seating-list">
                            {seating.map((seat, index) => (
                                <div className="student-seating-card" key={index}>
                                    <div className="seating-card-header">
                                        <div>
                                            <h4>{seat.examName}</h4>
                                            <p className="exam-subject">{seat.subject}</p>
                                        </div>
                                        <span className={getStatusBadge(seat.examStatus)}>
                                            {getStatusLabel(seat.examStatus)}
                                        </span>
                                    </div>

                                    <div className="exam-card-details">
                                        <div className="exam-detail-item">
                                            <span className="detail-label">Date</span>
                                            <span className="detail-value">{formatDate(seat.examDate)}</span>
                                        </div>
                                        <div className="exam-detail-item">
                                            <span className="detail-label">Start Time</span>
                                            <span className="detail-value">{seat.startTime || "—"}</span>
                                        </div>
                                        <div className="exam-detail-item">
                                            <span className="detail-label">End Time</span>
                                            <span className="detail-value">{seat.endTime || "—"}</span>
                                        </div>
                                        <div className="exam-detail-item">
                                            <span className="detail-label">Semester</span>
                                            <span className="detail-value">{seat.semester || profile?.semester || "—"}</span>
                                        </div>
                                    </div>

                                    <div className="seating-divider"></div>

                                    <div className="seating-card-details">
                                        <div className="seating-detail-group">
                                            <span className="seating-group-label">Room Assignment</span>
                                            <div className="seating-assignment-grid">
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Room / Hall</span>
                                                    <span className="detail-value detail-highlight">{seat.roomNumber}</span>
                                                </div>
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Building / Block</span>
                                                    <span className="detail-value">{seat.building || "—"}</span>
                                                </div>
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Floor</span>
                                                    <span className="detail-value">{seat.floor !== undefined && seat.floor !== null ? seat.floor : "—"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="seating-detail-group">
                                            <span className="seating-group-label">Seat Assignment</span>
                                            <div className="seating-assignment-grid">
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Seat Number</span>
                                                    <span className="detail-value detail-highlight">{seat.seatNumber}</span>
                                                </div>
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Row</span>
                                                    <span className="detail-value">{seat.row !== undefined && seat.row !== null ? seat.row : "—"}</span>
                                                </div>
                                                <div className="seating-detail-item">
                                                    <span className="detail-label">Column</span>
                                                    <span className="detail-value">{seat.column !== undefined && seat.column !== null ? seat.column : "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {(seat.department || profile?.department) && (
                                        <div className="seating-card-footer">
                                            <div className="seating-detail-item">
                                                <span className="detail-label">Department</span>
                                                <span className="detail-value">{seat.department || profile?.department}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default StudentDashboard;