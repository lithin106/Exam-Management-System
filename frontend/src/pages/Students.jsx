import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchStudents = async () => {
        try {
            setError("");
            const response = await API.get("/student");
            setStudents(response.data.students || []);
        } catch (error) {
            console.error("Fetch students error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to fetch students"
            );
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) {
            setFile(null);
            return;
        }

        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "application/pdf"
        ];

        const isExcel =
            selectedFile.name.endsWith(".xlsx") ||
            selectedFile.name.endsWith(".xls");
        const isPdf = selectedFile.name.endsWith(".pdf");

        if (!validTypes.includes(selectedFile.type) && !isExcel && !isPdf) {
            setError("Please upload an Excel (.xlsx, .xls) or PDF file.");
            setFile(null);
            return;
        }

        setError("");
        setMessage("");
        setFile(selectedFile);
    };

    const handleUpload = async (event) => {
        event.preventDefault();
        if (!file) {
            setError("Please select a file to upload.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await API.post("/student/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setMessage(
                response.data?.message ||
                `${response.data?.count || 0} students imported successfully.`
            );
            setFile(null);
            await fetchStudents();

            const fileInput = document.getElementById("student-file-input");
            if (fileInput) fileInput.value = "";
        } catch (error) {
            console.error("Student upload error:", error);
            setError(
                error.response?.data?.message ||
                "Student upload failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        try {
            setDeleting(true);
            setError("");
            setMessage("");

            const response = await API.delete("/student");

            setMessage(
                response.data?.message ||
                "All students deleted successfully."
            );

            setShowDeleteAllModal(false);
            await fetchStudents();
        } catch (error) {
            console.error("Delete all students error:", error);
            setError(
                error.response?.data?.message ||
                "Failed to delete students."
            );
        } finally {
            setDeleting(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const filteredStudents = students.filter((s) => {
        const query = searchTerm.toLowerCase();
        const id = (s.studentId || "").toLowerCase();
        const name = (s.name || "").toLowerCase();
        const dept = (s.department || "").toLowerCase();
        return id.includes(query) || name.includes(query) || dept.includes(query);
    });

    return (
        <div className="dashboard">
            {/* TOPBAR */}
            <header className="topbar">
                <div className="topbar-brand">
                    <button
                        className="btn-back"
                        onClick={() => navigate("/faculty/dashboard")}
                        title="Back to Dashboard"
                    >
                        <span>← Back</span>
                    </button>
                    <div>
                        <h1>Exam Management System</h1>
                        <span className="portal-tag">Faculty Portal</span>
                    </div>
                </div>

                <div className="topbar-nav">
                    <ThemeToggle />
                    <button
                        className="btn-nav-dashboard"
                        onClick={() => navigate("/faculty/dashboard")}
                    >
                        Dashboard
                    </button>
                    <button className="btn-nav-logout" onClick={logout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* CONTENT */}
            <main className="dashboard-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h2 className="page-title">Student Management</h2>
                        <p className="page-subtitle">
                            Upload student records and view enrolled candidates
                        </p>
                    </div>
                </div>

                {/* UPLOAD CARD */}
                <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                    <h3>Upload Student List</h3>
                    <p>
                        Supported formats: <strong>XLSX, XLS, PDF</strong> — Expected columns: <strong>Sl. No. | USN | Name</strong>
                    </p>

                    <form onSubmit={handleUpload}>
                        <input
                            id="student-file-input"
                            type="file"
                            accept=".xlsx, .xls, .pdf"
                            onChange={handleFileChange}
                        />

                        {file && (
                            <p style={{ marginTop: "8px", color: "#1e40af", fontWeight: 600 }}>
                                Selected: {file.name}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !file}
                            style={{ marginTop: "12px" }}
                        >
                            {loading ? "Uploading..." : "Upload File"}
                        </button>
                    </form>

                    {message && (
                        <div className="success-message">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                </div>

                {/* STUDENTS TABLE CARD */}
                <div className="dashboard-card">
                    <div className="table-header">
                        <div>
                            <h3>Registered Students</h3>
                            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                                Total: <strong>{students.length}</strong> students
                            </p>
                        </div>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input
                                type="text"
                                placeholder="Search by USN, Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    maxWidth: "260px",
                                    padding: "8px 12px",
                                    fontSize: "13px"
                                }}
                            />
                            <button
                                className="btn-danger"
                                disabled={students.length === 0}
                                onClick={() => setShowDeleteAllModal(true)}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                Delete All Students
                            </button>
                        </div>
                    </div>

                    {students.length === 0 ? (
                        <p style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8" }}>
                            No students registered yet. Upload a file above.
                        </p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>USN</th>
                                        <th>Student Name</th>
                                        <th>Department</th>
                                        <th>Semester</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, index) => (
                                        <tr key={student._id || index}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <span className="badge-pill badge-blue">
                                                    {student.studentId}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {student.name}
                                            </td>
                                            <td>{student.department || "CSE"}</td>
                                            <td>Sem {student.semester || "4"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showDeleteAllModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Delete All Students</h3>
                        <p>
                            Are you sure you want to delete <strong>all {students.length} registered student records</strong>?
                            This will also remove all associated seating assignments.
                            This action cannot be undone.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteAllModal(false)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={handleDeleteAll}
                                disabled={deleting}
                            >
                                {deleting ? "Deleting..." : "Delete All"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Students;