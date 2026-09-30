import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function FacultyAllocation() {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [allocationsMap, setAllocationsMap] = useState({});
    const [facultyList, setFacultyList] = useState([]);

    const [selectedExamId, setSelectedExamId] = useState("");
    const [selectedFacultyIds, setSelectedFacultyIds] = useState([]);

    const [isEditMode, setIsEditMode] = useState(false);
    const [activeViewAllocation, setActiveViewAllocation] = useState(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: "", employeeId: "", department: "CSE" });
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState("");

    const [facultyToDelete, setFacultyToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const [examsRes, allocsRes, facultyRes] = await Promise.all([
                API.get("/exams"),
                API.get("/faculty/allocations"),
                API.get("/faculty/list")
            ]);

            const fetchedExams = examsRes.data.exams || [];
            setExams(fetchedExams);

            const allocList = allocsRes.data.allocations || [];
            const allocMap = {};
            allocList.forEach((alloc) => {
                if (alloc.exam) {
                    const eId = typeof alloc.exam === "object" ? alloc.exam._id : alloc.exam;
                    allocMap[eId] = alloc;
                }
            });
            setAllocationsMap(allocMap);

            setFacultyList(facultyRes.data.faculty || []);
        } catch (err) {
            console.error("Fetch data error:", err);
            setError(err.response?.data?.message || "Failed to load examination or faculty data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExamSelect = (examId) => {
        setSelectedExamId(examId);
        setIsEditMode(false);
        setError("");
        setMessage("");

        const existingAlloc = allocationsMap[examId];
        if (existingAlloc) {
            setActiveViewAllocation(existingAlloc);
            setSelectedFacultyIds([]);
        } else {
            setActiveViewAllocation(null);
            setSelectedFacultyIds([]);
        }
    };

    const handleFacultyToggle = (facId) => {
        setSelectedFacultyIds((prev) => {
            if (prev.includes(facId)) {
                return prev.filter((id) => id !== facId);
            } else {
                return [...prev, facId];
            }
        });
    };

    const startEditMode = () => {
        if (!selectedExamObj) return;
        setIsEditMode(true);
        setError("");
        setMessage("");

        const existingAlloc = allocationsMap[selectedExamId];
        if (existingAlloc && Array.isArray(existingAlloc.allocatedFaculty)) {
            const currentlyAllocated = existingAlloc.allocatedFaculty;
            const preselected = [];

            currentlyAllocated.forEach((item) => {
                const matched = facultyList.find(
                    (f) => (item.faculty && (f._id === item.faculty._id || f._id === item.faculty)) ||
                           f.name.toLowerCase() === item.facultyName.toLowerCase()
                );
                if (matched && !preselected.includes(matched._id)) {
                    preselected.push(matched._id);
                }
            });
            setSelectedFacultyIds(preselected);
        } else {
            setSelectedFacultyIds([]);
        }
    };

    const cancelEditMode = () => {
        setIsEditMode(false);
        const existingAlloc = allocationsMap[selectedExamId];
        if (existingAlloc) {
            setActiveViewAllocation(existingAlloc);
        }
    };

    const handleSaveAllocation = async () => {
        if (!selectedExamObj) return;

        const reqCount = requiredRoomsCount;
        if (selectedFacultyIds.length !== reqCount) {
            setError(`Faculty count mismatch. ${reqCount} faculty members are required.`);
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const selectedFacultyObjs = facultyList.filter((f) => selectedFacultyIds.includes(f._id));

            const response = await API.post("/faculty/allocation", {
                examId: selectedExamId,
                selectedFaculty: selectedFacultyObjs
            });

            const savedAlloc = response.data.allocation;
            setMessage(response.data.message || "Faculty allocation saved successfully.");

            setAllocationsMap((prev) => ({
                ...prev,
                [selectedExamId]: savedAlloc
            }));

            setActiveViewAllocation(savedAlloc);
            setIsEditMode(false);
        } catch (err) {
            console.error("Save allocation error:", err);
            setError(err.response?.data?.message || "Failed to save faculty allocation.");
        } finally {
            setSaving(false);
        }
    };

    const handleAddFacultySubmit = async (e) => {
        e.preventDefault();
        if (!addForm.name.trim() || !addForm.employeeId.trim()) {
            setAddError("Full Name and Employee ID are required.");
            return;
        }

        try {
            setAddLoading(true);
            setAddError("");

            const response = await API.post("/faculty/add", addForm);
            const newFaculty = response.data.faculty;

            setFacultyList((prev) => [newFaculty, ...prev]);
            setShowAddModal(false);
            setAddForm({ name: "", employeeId: "", department: "CSE" });
            setMessage(response.data.message || "Faculty member added successfully.");
        } catch (err) {
            console.error("Add faculty error:", err);
            setAddError(err.response?.data?.message || "Failed to add faculty member.");
        } finally {
            setAddLoading(false);
        }
    };

    const confirmDeleteFaculty = async () => {
        if (!facultyToDelete) return;

        try {
            setDeleteLoading(true);
            setDeleteError("");

            await API.delete(`/faculty/${facultyToDelete._id}`);

            setFacultyList((prev) => prev.filter((f) => f._id !== facultyToDelete._id));
            setSelectedFacultyIds((prev) => prev.filter((id) => id !== facultyToDelete._id));

            setMessage(`Faculty member "${facultyToDelete.name}" deleted successfully.`);
            setFacultyToDelete(null);
        } catch (err) {
            console.error("Delete faculty error:", err);
            setDeleteError(err.response?.data?.message || "Failed to delete faculty member.");
        } finally {
            setDeleteLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const selectedExamObj = exams.find((e) => e._id === selectedExamId);
    const requiredRoomsCount = selectedExamObj?.rooms?.length || 0;
    const selectedCount = selectedFacultyIds.length;
    const isAllocated = Boolean(allocationsMap[selectedExamId]);

    let validationMessage = "";
    let validationHeader = "";
    let isCountValid = false;

    if (selectedExamObj && (isEditMode || !isAllocated)) {
        if (selectedCount < requiredRoomsCount) {
            const diff = requiredRoomsCount - selectedCount;
            validationHeader = "Insufficient Faculty Selected";
            validationMessage = `${selectedCount} faculty selected, but ${requiredRoomsCount} classrooms require ${requiredRoomsCount} faculty members. Please select ${diff} more faculty member${diff > 1 ? "s" : ""}.`;
            isCountValid = false;
        } else if (selectedCount > requiredRoomsCount) {
            const diff = selectedCount - requiredRoomsCount;
            validationHeader = "Too Many Faculty Selected";
            validationMessage = `${selectedCount} faculty selected, but ${requiredRoomsCount} classrooms require ${requiredRoomsCount} faculty members. Please deselect ${diff} faculty member${diff > 1 ? "s" : ""}.`;
            isCountValid = false;
        } else {
            validationHeader = "Faculty count matches.";
            validationMessage = `${selectedCount} faculty members selected for ${requiredRoomsCount} classrooms. System is ready to assign rooms.`;
            isCountValid = true;
        }
    }

    return (
        <div className="dashboard">
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

            <main className="dashboard-content">
                <div className="page-header">
                    <div className="page-header-left">
                        <h2 className="page-title">Faculty Allocation</h2>
                        <p className="page-subtitle">
                            Assign invigilators to examination halls and generate official allocation sheets
                        </p>
                    </div>
                </div>

                <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                    <div style={{ marginBottom: "16px" }}>
                        <h3 style={{ margin: "0 0 4px 0" }}>Select Examination</h3>
                        <p style={{ margin: 0, color: "var(--slate-500)", fontSize: "13px" }}>
                            Select exactly ONE examination at a time to manage faculty invigilation assignments.
                        </p>
                    </div>

                    {loading ? (
                        <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>Loading examinations...</p>
                    ) : exams.length === 0 ? (
                        <p style={{ color: "var(--slate-500)", fontSize: "14px" }}>No active examinations found.</p>
                    ) : (
                        <div
                            className="checkbox-grid"
                            style={{
                                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))"
                            }}
                        >
                            {exams.map((exam) => {
                                const isSelected = selectedExamId === exam._id;
                                const examAllocated = Boolean(allocationsMap[exam._id]);

                                return (
                                    <div
                                        key={exam._id}
                                        onClick={() => handleExamSelect(exam._id)}
                                        style={{
                                            border: `2px solid ${isSelected ? "var(--primary-border)" : "var(--border-color)"}`,
                                            background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                                            borderRadius: "8px",
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                                            <input
                                                type="radio"
                                                name="examSelectionRadio"
                                                checked={isSelected}
                                                onChange={() => handleExamSelect(exam._id)}
                                                style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                            />
                                            <strong style={{ fontSize: "15px", color: "var(--slate-900)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {exam.examName}
                                            </strong>
                                            {examAllocated ? (
                                                <span className="badge-pill badge-emerald">
                                                    Allocated
                                                </span>
                                            ) : (
                                                <span className="badge-pill badge-slate">
                                                    Not Allocated
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ fontSize: "12px", color: "var(--slate-600)", lineHeight: "1.5", marginLeft: "26px" }}>
                                            <div><strong>Subject:</strong> {exam.subject} (Sem {exam.semester})</div>
                                            <div><strong>Date & Time:</strong> {new Date(exam.examDate).toLocaleDateString()} | {exam.startTime} - {exam.endTime}</div>
                                            <div><strong>Rooms:</strong> {exam.rooms?.length || 0} Classrooms</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedExamObj && (
                    <div className="dashboard-card printable-card" style={{ marginBottom: "24px" }}>
                        <div className="printable-header-controls no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px", marginBottom: "16px" }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "18px" }}>
                                    {selectedExamObj.examName} — {selectedExamObj.subject}
                                </h3>
                                <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--slate-500)" }}>
                                    Date: {new Date(selectedExamObj.examDate).toLocaleDateString()} | Time: {selectedExamObj.startTime} - {selectedExamObj.endTime} | Semester: {selectedExamObj.semester}
                                </p>
                            </div>

                            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                                <span className="badge-pill badge-blue" style={{ fontSize: "13px", padding: "6px 12px" }}>
                                    Required Faculty: {requiredRoomsCount}
                                </span>

                                <button
                                    type="button"
                                    className="btn-add-faculty-compact"
                                    onClick={() => {
                                        setShowAddModal(true);
                                        setAddError("");
                                    }}
                                >
                                    + Add Faculty
                                </button>

                                {isAllocated ? (
                                    <span className="badge-pill badge-emerald" style={{ fontSize: "13px", padding: "6px 12px" }}>
                                        Allocated
                                    </span>
                                ) : (
                                    <span className="badge-pill badge-slate" style={{ fontSize: "13px", padding: "6px 12px" }}>
                                        Not Allocated
                                    </span>
                                )}
                            </div>
                        </div>

                        {isAllocated && !isEditMode && activeViewAllocation && (
                            <div style={{ marginBottom: "20px" }}>
                                <div className="no-print" style={{ background: "var(--success-bg)", border: "1px solid var(--success-border)", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                                    <div>
                                        <strong style={{ color: "var(--success)", fontSize: "15px" }}>
                                            Faculty allocation for this exam has already been completed.
                                        </strong>
                                        <div style={{ fontSize: "13px", color: "var(--slate-600)", marginTop: "2px" }}>
                                            Allocated invigilators: {activeViewAllocation.allocatedFaculty?.length || 0} faculty member(s) across {requiredRoomsCount} classroom(s).
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            onClick={startEditMode}
                                            style={{ padding: "8px 16px" }}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                <div id="official-faculty-allocation-sheet" style={{ border: "1px solid var(--border-color)", borderRadius: "8px", padding: "24px", background: "var(--bg-card)" }}>
                                    <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                                        <h4 style={{ margin: 0, fontSize: "16px" }}>Official Faculty Allocation Sheet</h4>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={() => window.print()}
                                            style={{ fontSize: "12px", padding: "6px 14px" }}
                                        >
                                            Print Sheet
                                        </button>
                                    </div>

                                    <div style={{ textTransform: "uppercase", fontWeight: 800, fontSize: "16px", marginBottom: "8px", color: "var(--slate-900)" }}>
                                        OFFICIAL FACULTY ALLOCATION SHEET
                                    </div>
                                    <div style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px", color: "var(--slate-800)" }}>
                                        {selectedExamObj.examName} — {selectedExamObj.subject}
                                    </div>
                                    <div style={{ fontSize: "13px", color: "var(--slate-600)", marginBottom: "16px" }}>
                                        Date: {new Date(selectedExamObj.examDate).toLocaleDateString()} | Time: {selectedExamObj.startTime} - {selectedExamObj.endTime} | Semester: {selectedExamObj.semester}
                                    </div>

                                    <div className="table-container">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>SL. NO.</th>
                                                    <th>FACULTY INVIGILATOR</th>
                                                    <th>EMPLOYEE ID</th>
                                                    <th>DEPARTMENT</th>
                                                    <th>ASSIGNED CLASSROOM</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {activeViewAllocation.allocatedFaculty?.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>{idx + 1}</td>
                                                        <td style={{ fontWeight: 600 }}>{item.facultyName}</td>
                                                        <td>{item.employeeId || "—"}</td>
                                                        <td>{item.department || "CSE"}</td>
                                                        <td>
                                                            <span className="badge-pill badge-blue">
                                                                {item.roomNumber || (item.room?.roomNumber) || "Hall"}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {(isEditMode || !isAllocated) && (
                            <div className="no-print">
                                {isEditMode && (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light)", border: "1px solid var(--primary-border)", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px" }}>
                                        <span style={{ fontWeight: 600, color: "var(--primary)", fontSize: "14px" }}>
                                            Editing Existing Faculty Allocation
                                        </span>
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            onClick={cancelEditMode}
                                            style={{ fontSize: "12px", padding: "4px 10px" }}
                                        >
                                            Cancel Editing
                                        </button>
                                    </div>
                                )}

                                <div style={{ marginBottom: "16px" }}>
                                    <h4 style={{ margin: "0 0 4px 0" }}>Select Available Faculty</h4>
                                    <p style={{ margin: 0, color: "var(--slate-500)", fontSize: "13px" }}>
                                        Check faculty members available for invigilation. Selected count must equal required classrooms ({requiredRoomsCount}).
                                    </p>
                                </div>

                                <div className="checkbox-grid" style={{ marginBottom: "20px" }}>
                                    {facultyList.map((fac) => {
                                        const isChecked = selectedFacultyIds.includes(fac._id);
                                        return (
                                            <div
                                                key={fac._id}
                                                style={{
                                                    border: `1px solid ${isChecked ? "var(--primary-border)" : "var(--border-color)"}`,
                                                    background: isChecked ? "var(--primary-light)" : "var(--bg-card)",
                                                    borderRadius: "8px",
                                                    padding: "10px 12px",
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    gap: "8px"
                                                }}
                                            >
                                                <label
                                                    className="checkbox-item"
                                                    style={{
                                                        border: "none",
                                                        padding: 0,
                                                        margin: 0,
                                                        background: "transparent",
                                                        flex: 1
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleFacultyToggle(fac._id)}
                                                    />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ color: "var(--slate-900)", fontWeight: 600, fontSize: "13px" }}>{fac.name}</div>
                                                        <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                            {fac.employeeId} · {fac.department}
                                                        </div>
                                                    </div>
                                                </label>

                                                <button
                                                    type="button"
                                                    className="btn-delete-compact"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFacultyToDelete(fac);
                                                        setDeleteError("");
                                                    }}
                                                    title="Delete Faculty"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{
                                    padding: "14px 18px",
                                    borderRadius: "8px",
                                    marginBottom: "20px",
                                    background: isCountValid ? "var(--success-bg)" : "var(--danger-bg)",
                                    border: `1px solid ${isCountValid ? "var(--success-border)" : "var(--danger-border)"}`
                                }}>
                                    <strong style={{ color: isCountValid ? "var(--success)" : "var(--danger)", fontSize: "14px", display: "block" }}>
                                        {validationHeader}
                                    </strong>
                                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--slate-700)" }}>
                                        {validationMessage}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="btn-success"
                                    onClick={handleSaveAllocation}
                                    disabled={saving || !isCountValid}
                                    style={{ width: "100%", padding: "12px" }}
                                >
                                    {saving ? "Saving Allocation..." : "Save & Generate Random Classroom Allocation"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {message && (
                    <div className="success-message" style={{ marginBottom: "16px" }}>
                        {message}
                    </div>
                )}

                {error && (
                    <div className="error-message" style={{ marginBottom: "16px" }}>
                        {error}
                    </div>
                )}
            </main>

            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-card" style={{ maxWidth: "440px", width: "95%" }}>
                        <h3 style={{ marginBottom: "6px" }}>Add Faculty</h3>
                        <p style={{ fontSize: "13px", color: "var(--slate-500)", marginBottom: "16px" }}>
                            Add a new faculty member to be available for invigilation.
                        </p>

                        <form onSubmit={handleAddFacultySubmit}>
                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Example: Dr. John Doe"
                                    value={addForm.name}
                                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--input-text)" }}
                                />
                            </div>

                            <div style={{ marginBottom: "14px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
                                    Employee ID
                                </label>
                                <input
                                    type="text"
                                    placeholder="Example: FAC008"
                                    value={addForm.employeeId}
                                    onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                                    required
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--input-text)" }}
                                />
                            </div>

                            <div style={{ marginBottom: "18px" }}>
                                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--slate-700)", marginBottom: "4px" }}>
                                    Department / Branch
                                </label>
                                <input
                                    type="text"
                                    placeholder="Example: CSE"
                                    value={addForm.department}
                                    onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                                    style={{ width: "100%", padding: "9px 12px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--input-text)" }}
                                />
                            </div>

                            {addError && (
                                <div className="error-message" style={{ marginBottom: "14px", padding: "8px 12px", fontSize: "12px" }}>
                                    {addError}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={addLoading}
                                >
                                    {addLoading ? "Adding..." : "Add Faculty"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {facultyToDelete && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Delete Faculty?</h3>
                        <p style={{ marginTop: "6px" }}>
                            Are you sure you want to delete <strong>{facultyToDelete.name}</strong> ({facultyToDelete.employeeId})?
                        </p>

                        {deleteError && (
                            <div className="error-message" style={{ marginTop: "12px", padding: "10px 12px", fontSize: "13px" }}>
                                {deleteError}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={() => setFacultyToDelete(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn-delete"
                                onClick={confirmDeleteFaculty}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FacultyAllocation;
