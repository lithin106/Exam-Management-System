import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function SeatingPlan() {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState("");
    const [selectedExams, setSelectedExams] = useState([]);
    const [seating, setSeating] = useState([]);
    const [statistics, setStatistics] = useState(null);
    const [studentSearch, setStudentSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState(false);
    const [loadingExams, setLoadingExams] = useState(true);
    const [uploadingTemplate, setUploadingTemplate] = useState(false);
    const [templateFile, setTemplateFile] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [downloadingNotice, setDownloadingNotice] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchExams = async () => {
        try {
            setLoadingExams(true);
            setError("");

            const response = await API.get("/exams");

            if (response.data.success) {
                setExams(response.data.exams || []);
            } else {
                setExams([]);
                setError("No active examinations found.");
            }
        } catch (error) {
            console.error("Fetch exams error:", error);
            setExams([]);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/");
                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to load examinations."
            );
        } finally {
            setLoadingExams(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const allExamsSelected = exams.length > 0 && selectedExams.length === exams.length;

    const handleSelectAllExams = () => {
        if (allExamsSelected) {
            setSelectedExams([]);
            setSelectedExam("");
            setSeating([]);
            setStatistics(null);
            setError("");
            setMessage("");
        } else {
            const allIds = exams.map((e) => e._id);
            setSelectedExams(allIds);
            if (!selectedExam && allIds.length > 0) {
                setSelectedExam(allIds[0]);
            }
        }
    };

    const handleExamCheckbox = (examId) => {
        setSelectedExams((prev) => {
            const exists = prev.includes(examId);
            let updated;
            if (exists) {
                updated = prev.filter((id) => id !== examId);
                if (selectedExam === examId) {
                    setSelectedExam(updated[0] || "");
                    if (updated.length === 0) {
                        setSeating([]);
                        setStatistics(null);
                    }
                }
            } else {
                updated = [...prev, examId];
                if (!selectedExam || updated.length === 1) {
                    setSelectedExam(examId);
                }
            }
            return updated;
        });
    };

    const generateSeating = async () => {
        const targets = selectedExams.length > 0 ? selectedExams : (selectedExam ? [selectedExam] : []);
        if (targets.length === 0) {
            setError("Please select at least one examination.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");
            setSeating([]);
            setStatistics(null);

            if (targets.length === 1) {
                const targetExamId = targets[0];
                const response = await API.post("/seating/generate", {
                    examId: targetExamId
                });

                setMessage(
                    response.data.message ||
                    "Seating plan generated successfully."
                );

                setStatistics(response.data.statistics || null);

                const seatingResponse = await API.get(`/seating/${targetExamId}`);
                setSeating(seatingResponse.data.assignments || []);
                setSelectedExam(targetExamId);
            } else {
                let successCount = 0;
                let failCount = 0;
                const errors = [];

                for (let i = 0; i < targets.length; i++) {
                    const examId = targets[i];
                    const examName = exams.find((e) => e._id === examId)?.examName || `Exam ${i + 1}`;
                    try {
                        await API.post("/seating/generate", { examId });
                        successCount++;
                    } catch (err) {
                        console.error(`Error generating seating for ${examName}:`, err);
                        failCount++;
                        errors.push(examName);
                    }
                }

                if (failCount === 0) {
                    setMessage(
                        `Successfully generated seating arrangements for all ${successCount} examinations.`
                    );
                } else {
                    setError(
                        `Generated seating for ${successCount} examination(s). Failed for: ${errors.join(", ")}.`
                    );
                }

                const activeToLoad = targets.includes(selectedExam) ? selectedExam : targets[0];
                setSelectedExam(activeToLoad);

                try {
                    const seatingResponse = await API.get(`/seating/${activeToLoad}`);
                    setSeating(seatingResponse.data.assignments || []);
                } catch (loadErr) {
                    console.error("Error loading seating plan for active exam:", loadErr);
                }
            }
        } catch (error) {
            console.error("Generate seating error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to generate seating plan."
            );
            setSeating([]);
        } finally {
            setLoading(false);
        }
    };

    const viewExistingPlan = async () => {
        if (!selectedExam) {
            setError("Please select an examination.");
            return;
        }

        try {
            setLoadingPlan(true);
            setError("");
            setMessage("");
            setStatistics(null);

            const response = await API.get(`/seating/${selectedExam}`);
            const assignments = response.data.assignments || [];
            setSeating(assignments);

            if (assignments.length === 0) {
                setMessage(
                    "No seating plan has been generated for this examination yet."
                );
            } else {
                setMessage("Existing seating plan loaded successfully.");
            }
        } catch (error) {
            console.error("View seating error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to load seating plan."
            );
        } finally {
            setLoadingPlan(false);
        }
    };

    const deletePlan = async () => {
        if (!selectedExam) return;

        try {
            setError("");
            setMessage("");

            await API.delete(`/seating/${selectedExam}`);
            setMessage("Seating plan cleared successfully.");
            setSeating([]);
            setStatistics(null);
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Delete seating error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to delete seating plan."
            );
        }
    };

    const uploadTemplate = async () => {
        if (!selectedExam) {
            setError("Please select an examination first.");
            return;
        }

        if (!templateFile) {
            setError("Please select a template image.");
            return;
        }

        try {
            setUploadingTemplate(true);
            setError("");
            setMessage("");

            const formData = new FormData();
            formData.append("template", templateFile);

            const response = await API.post(
                `/seating/${selectedExam}/template`,
                formData
            );

            setMessage(
                response.data.message ||
                "Output template uploaded successfully."
            );

            setTemplateFile(null);

            const fileInput = document.getElementById("template-upload");
            if (fileInput) fileInput.value = "";
        } catch (error) {
            console.error("Template upload error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to upload output template."
            );
        } finally {
            setUploadingTemplate(false);
        }
    };

    const downloadPDF = async () => {
        if (!selectedExam) {
            setError("Please select an examination.");
            return;
        }

        try {
            setDownloadingPdf(true);
            setError("");
            setMessage("Generating Seating Plan PDF...");

            const response = await API.get(`/seating/${selectedExam}/pdf`, {
                responseType: "blob"
            });

            const blob = new Blob([response.data], {
                type: "application/pdf"
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Seating_Plan.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage("Seating PDF downloaded successfully.");
        } catch (error) {
            console.error("PDF download error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to download PDF."
            );
        } finally {
            setDownloadingPdf(false);
        }
    };

    const downloadNoticeBoard = async () => {
        if (!selectedExam) {
            setError("Please select an examination.");
            return;
        }

        try {
            setDownloadingNotice(true);
            setError("");
            setMessage("Generating Notice Board Sheet...");

            const response = await API.get(
                `/seating/${selectedExam}/notice-board`,
                { responseType: "blob" }
            );

            const blob = new Blob([response.data], {
                type: "application/pdf"
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Notice_Board_Seating.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage("Notice Board Sheet downloaded successfully.");
        } catch (error) {
            console.error("Notice Board download error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to download Notice Board Sheet."
            );
        } finally {
            setDownloadingNotice(false);
        }
    };

    const groupByRoom = (items) => {
        const grouped = {};
        items.forEach((assignment) => {
            const roomId = assignment.room?._id || assignment.room;
            if (!roomId) return;
            if (!grouped[roomId]) grouped[roomId] = [];
            grouped[roomId].push(assignment);
        });
        return grouped;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    // Filter seat assignments by student search query
    const query = studentSearch.trim().toLowerCase();
    const searchFilteredSeating = seating.filter((a) => {
        if (!query) return true;
        const usn = (a.student?.studentId || a.studentId || "").toLowerCase();
        const name = (a.student?.name || a.studentName || "").toLowerCase();
        const seat = (a.seatNumber || `R${a.row}-C${a.column}`).toLowerCase();
        const roomNum = (a.room?.roomNumber || "").toLowerCase();
        return usn.includes(query) || name.includes(query) || seat.includes(query) || roomNum.includes(query);
    });

    const matchingStudents = query
        ? seating.filter((a) => {
            const usn = (a.student?.studentId || a.studentId || "").toLowerCase();
            const name = (a.student?.name || a.studentName || "").toLowerCase();
            const seat = (a.seatNumber || `R${a.row}-C${a.column}`).toLowerCase();
            return usn.includes(query) || name.includes(query) || seat.includes(query);
        })
        : [];

    const groupedRooms = groupByRoom(searchFilteredSeating);
    const currentExamObj = exams.find((e) => e._id === selectedExam);

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
                        <h2 className="page-title">Seating Arrangement</h2>
                        <p className="page-subtitle">
                            Generate automated seating allocations, locate students, and export official documents
                        </p>
                    </div>
                </div>

                {/* SELECT EXAM CARD */}
                <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", gap: "16px" }}>
                        <div>
                            <h3 style={{ margin: "0 0 4px 0" }}>Select Examinations</h3>
                            <p style={{ margin: 0 }}>
                                Choose examinations to generate, view, or export seating arrangements.
                            </p>
                        </div>

                        {!loadingExams && exams.length > 0 && (
                            <label
                                className="checkbox-item"
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "6px 14px",
                                    margin: 0,
                                    borderColor: allExamsSelected ? "var(--primary-border)" : "var(--border-color)",
                                    background: allExamsSelected ? "var(--primary-light)" : "var(--bg-card)",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    userSelect: "none",
                                    flexShrink: 0
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={allExamsSelected}
                                    ref={(el) => {
                                        if (el) {
                                            el.indeterminate = selectedExams.length > 0 && selectedExams.length < exams.length;
                                        }
                                    }}
                                    onChange={handleSelectAllExams}
                                    style={{ width: "15px", height: "15px", margin: 0, cursor: "pointer" }}
                                />
                                <div style={{ lineHeight: "1.2" }}>
                                    <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--slate-900)" }}>Select All</span>
                                    <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                        {exams.length} examinations
                                    </div>
                                </div>
                            </label>
                        )}
                    </div>

                    {loadingExams ? (
                        <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>Loading examinations...</p>
                    ) : exams.length === 0 ? (
                        <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>No active examinations found.</p>
                    ) : (
                        <>

                            {/* EXAMINATIONS CHECKBOX GRID */}
                            <div
                                className="checkbox-grid"
                                style={{
                                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                                    marginBottom: "16px"
                                }}
                            >
                                {exams.map((exam) => {
                                    const isChecked = selectedExams.includes(exam._id);
                                    const isActive = selectedExam === exam._id;
                                    return (
                                        <label
                                            key={exam._id}
                                            className="checkbox-item"
                                            style={{
                                                borderColor: isChecked ? "var(--primary-border)" : "var(--border-color)",
                                                background: isChecked ? "var(--primary-light)" : "var(--bg-card)",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "10px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleExamCheckbox(exam._id)}
                                                style={{ marginTop: "2px" }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: 600, color: "var(--slate-900)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{exam.examName}</span>
                                                    {isActive && selectedExams.length > 1 && (
                                                        <span className="badge-pill badge-blue" style={{ fontSize: "10px", padding: "1px 6px" }}>
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: "12px", color: "var(--slate-600)", marginTop: "2px" }}>
                                                    {exam.subject} (Sem {exam.semester})
                                                </div>
                                                <div style={{ fontSize: "11px", color: "var(--slate-400)", marginTop: "2px" }}>
                                                    {new Date(exam.examDate).toLocaleDateString()} | {exam.rooms?.length || 0} Rooms
                                                </div>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* IF MULTIPLE EXAMS SELECTED: ACTIVE EXAM SELECTOR FOR VIEWING/EXPORTING */}
                            {selectedExams.length > 1 && (
                                <div style={{ marginBottom: "14px" }}>
                                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--slate-700)", marginBottom: "6px" }}>
                                        View / Export Examination:
                                    </label>
                                    <select
                                        value={selectedExam}
                                        onChange={(event) => {
                                            setSelectedExam(event.target.value);
                                            setSeating([]);
                                            setStatistics(null);
                                            setStudentSearch("");
                                            setError("");
                                            setMessage("");
                                        }}
                                    >
                                        {exams
                                            .filter((exam) => selectedExams.includes(exam._id))
                                            .map((exam) => (
                                                <option key={exam._id} value={exam._id}>
                                                    {exam.examName} — {exam.subject} (Sem {exam.semester})
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {currentExamObj && (
                        <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span className="badge-pill badge-blue">
                                Date: {new Date(currentExamObj.examDate).toLocaleDateString()}
                            </span>
                            <span className="badge-pill badge-slate">
                                Time: {currentExamObj.startTime} - {currentExamObj.endTime}
                            </span>
                            <span className="badge-pill badge-emerald">
                                Rooms: {currentExamObj.rooms?.length || 0} Halls
                            </span>
                        </div>
                    )}

                    {/* OPTIONAL TEMPLATE UPLOAD */}
                    <div
                        style={{
                            marginTop: "18px",
                            padding: "14px",
                            background: "var(--table-header-bg)",
                            borderRadius: "6px",
                            border: "1px solid var(--border-color)"
                        }}
                    >
                        <h4 style={{ fontSize: "13px", fontWeight: 700, color: "var(--slate-900)", marginBottom: "4px" }}>
                            Header Image (Optional)
                        </h4>
                        <p style={{ fontSize: "13px", color: "var(--slate-500)", margin: "0 0 10px 0" }}>
                            Upload college logo/header image to embed above the seating chart and notice board.
                        </p>

                        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <input
                                id="template-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                style={{ maxWidth: "300px", fontSize: "13px" }}
                                onChange={(event) => {
                                    setTemplateFile(event.target.files?.[0] || null);
                                    setError("");
                                }}
                            />
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={uploadTemplate}
                                disabled={uploadingTemplate || !selectedExam || !templateFile}
                                style={{ padding: "8px 14px", fontSize: "13px" }}
                            >
                                {uploadingTemplate ? "Uploading..." : "Upload Header"}
                            </button>
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="action-buttons">
                        <button
                            className="btn-success"
                            onClick={generateSeating}
                            disabled={loading || loadingExams || (selectedExams.length === 0 && !selectedExam)}
                        >
                            {loading
                                ? "Allocating..."
                                : selectedExams.length > 1
                                    ? `Generate Seating (${selectedExams.length} Exams)`
                                    : "Generate Seating"}
                        </button>

                        <button
                            className="btn-secondary"
                            onClick={viewExistingPlan}
                            disabled={loadingPlan || loadingExams || !selectedExam}
                        >
                            {loadingPlan ? "Loading..." : "View Existing Plan"}
                        </button>

                        <button
                            className="btn-pdf"
                            onClick={downloadPDF}
                            disabled={!selectedExam || seating.length === 0 || downloadingPdf}
                        >
                            {downloadingPdf ? "Exporting..." : "Download Seating PDF"}
                        </button>

                        <button
                            className="btn-amber"
                            onClick={downloadNoticeBoard}
                            disabled={!selectedExam || seating.length === 0 || downloadingNotice}
                        >
                            {downloadingNotice ? "Exporting..." : "Notice Board Sheet"}
                        </button>

                        {seating.length > 0 && (
                            <button
                                className="btn-danger"
                                onClick={() => setShowDeleteModal(true)}
                            >
                                Clear Plan
                            </button>
                        )}
                    </div>

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

                {/* STATISTICS CARDS */}
                {statistics && (
                    <div className="statistics-grid">
                        <div className="stat-card">
                            <h3>{statistics.totalStudents}</h3>
                            <p>Total Students</p>
                        </div>

                        <div className="stat-card">
                            <h3>{statistics.assignedStudents}</h3>
                            <p>Assigned</p>
                        </div>

                        <div className="stat-card">
                            <h3>{statistics.unassignedStudents}</h3>
                            <p>Unassigned</p>
                        </div>

                        <div className="stat-card">
                            <h3>{statistics.totalSeats}</h3>
                            <p>Total Usable Seats</p>
                        </div>

                        <div className="stat-card">
                            <h3>{statistics.usedRooms ?? "-"}</h3>
                            <p>Halls Utilized</p>
                        </div>
                    </div>
                )}

                {/* STUDENT LOOKUP / SEARCH BAR */}
                {seating.length > 0 && (
                    <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                        <div className="table-header">
                            <div>
                                <h3>Search Student Location</h3>
                                <p style={{ margin: 0, color: "var(--slate-500)", fontSize: "13px" }}>
                                    Search by USN or Name to immediately pinpoint student hall and seat code
                                </p>
                            </div>

                            <input
                                type="text"
                                placeholder="Search by USN or Name..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                style={{
                                    maxWidth: "300px",
                                    padding: "8px 12px",
                                    fontSize: "13px"
                                }}
                            />
                        </div>

                        {/* HIGHLIGHTED STUDENT LOCATION MATCHES */}
                        {query && matchingStudents.length > 0 && (
                            <div style={{ marginTop: "12px", display: "grid", gap: "10px" }}>
                                {matchingStudents.map((match) => {
                                    const seatCode = match.seatNumber || `R${match.row}-C${match.column}`;
                                    return (
                                        <div
                                            key={match._id}
                                            style={{
                                                padding: "14px 18px",
                                                background: "var(--primary-light)",
                                                border: "1px solid var(--primary-border)",
                                                borderRadius: "6px",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                flexWrap: "wrap",
                                                gap: "10px"
                                            }}
                                        >
                                            <div>
                                                <strong style={{ color: "var(--primary)", fontSize: "15px" }}>
                                                    {match.student?.name || match.studentName} ({match.student?.studentId || match.studentId})
                                                </strong>
                                                <div style={{ fontSize: "13px", color: "var(--slate-500)", marginTop: "2px" }}>
                                                    Department: {match.student?.department || match.department || "CSE"}
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <span className="badge-pill badge-blue" style={{ fontSize: "13px", padding: "4px 10px" }}>
                                                    Room: {match.room?.roomNumber || "Hall"}
                                                </span>
                                                <span className="badge-pill badge-emerald" style={{ fontSize: "13px", padding: "4px 10px" }}>
                                                    Seat: {seatCode}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {query && matchingStudents.length === 0 && (
                            <p style={{ marginTop: "12px", color: "var(--danger)", fontSize: "13px" }}>
                                No student matching "{studentSearch}" found in this seating plan.
                            </p>
                        )}
                    </div>
                )}

                {/* SEATING PLAN TABLE */}
                {seating.length > 0 && (
                    <div>
                        <h3 className="section-title">
                            Allocated Room Seating Chart {query && `(Filtered: ${searchFilteredSeating.length} students)`}
                        </h3>

                        {Object.keys(groupedRooms).length === 0 ? (
                            <div className="dashboard-card" style={{ textAlign: "center", padding: "30px" }}>
                                <p style={{ color: "var(--slate-500)" }}>No students match the search query.</p>
                            </div>
                        ) : (
                            Object.entries(groupedRooms).map(([roomId, assignments]) => {
                                const room = assignments[0]?.room;
                                const numDesks = Math.max(1, Math.floor((Number(room?.columns) || 6) / 2));
                                return (
                                    <div className="room-card" key={roomId}>
                                        <div className="room-header">
                                            <div className="room-title-group">
                                                <h3>{room?.roomNumber || "Examination Room"}</h3>
                                                <p>
                                                    {room?.building || "Main Block"}
                                                    {room?.floor ? ` • Floor ${room.floor}` : ""}
                                                    {room?.rows ? ` • ${room.rows} Rows • ${numDesks} Desks / Row` : ""}
                                                </p>
                                            </div>

                                            <div className="room-stats-badge">
                                                {assignments.length} Students Allocated
                                            </div>
                                        </div>

                                        <div className="table-container">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Seat Code</th>
                                                        <th>Student USN</th>
                                                        <th>Student Name</th>
                                                        <th>Department</th>
                                                        <th>Row</th>
                                                        <th>Col</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {[...assignments]
                                                        .sort((a, b) => {
                                                            if (a.row !== b.row) return a.row - b.row;
                                                            return a.column - b.column;
                                                        })
                                                        .map((assignment) => (
                                                            <tr key={assignment._id}>
                                                                <td>
                                                                    <strong style={{ color: "var(--primary)" }}>
                                                                        {assignment.seatNumber || `R${assignment.row}-C${assignment.column}`}
                                                                    </strong>
                                                                </td>
                                                                <td>
                                                                    <span className="badge-pill badge-blue">
                                                                        {assignment.student?.studentId || assignment.studentId || "-"}
                                                                    </span>
                                                                </td>
                                                                <td style={{ fontWeight: 600 }}>
                                                                    {assignment.student?.name || assignment.studentName || "-"}
                                                                </td>
                                                                <td>
                                                                    {assignment.student?.department || assignment.department || "CSE"}
                                                                </td>
                                                                <td>Row {assignment.row}</td>
                                                                <td>Col {assignment.column}</td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {seating.length === 0 && !loading && !loadingExams && (
                    <div className="dashboard-card" style={{ textAlign: "center", padding: "36px" }}>
                        <h3>No Seating Plan Generated Yet</h3>
                        <p style={{ maxWidth: "460px", margin: "0 auto" }}>
                            Select an active examination above and click <strong>Generate Seating</strong> to create the arrangement.
                        </p>
                    </div>
                )}
            </main>

            {/* CLEAR PLAN MODAL */}
            {showDeleteModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Confirm Clearing Seating Plan</h3>
                        <p>
                            Are you sure you want to clear the seating arrangement for this examination?
                            You can regenerate it at any time.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={deletePlan}
                            >
                                Clear Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SeatingPlan;