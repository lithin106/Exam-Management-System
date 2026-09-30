import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Exams() {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [rooms, setRooms] = useState([]);

    const [form, setForm] = useState({
        examName: "",
        subject: "",
        examDate: "",
        startTime: "",
        endTime: "",
        semester: "",
        rooms: []
    });

    const [roomConfigurations, setRoomConfigurations] = useState({});

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [deleteExamId, setDeleteExamId] = useState(null);
    const [deleteExamName, setDeleteExamName] = useState("");

    const [deskModalRoom, setDeskModalRoom] = useState(null);

    const computeUsable = (cols) => {
        const c = Number(cols) || 0;
        return c >= 6 ? 6 : c >= 4 ? 4 : c >= 2 ? 2 : c;
    };

    const getDesksPerRow = (room) => {
        const cols = Number(room.columns) || 6;
        return Math.max(1, Math.floor(cols / 2));
    };

    const getDefectiveDesks = (roomId) => {
        return roomConfigurations[roomId] || [];
    };

    const getRoomUsableCapacity = (room) => {
        const hasBenches =
            room.leftDeskBenches !== undefined &&
            room.middleDeskBenches !== undefined &&
            room.rightDeskBenches !== undefined;

        let normalCapacity;
        if (hasBenches) {
            const spb = Number(room.studentsPerBench) || 2;
            normalCapacity = (Number(room.leftDeskBenches) + Number(room.middleDeskBenches) + Number(room.rightDeskBenches)) * spb;
        } else {
            normalCapacity = Number(room.capacity) || 0;
        }

        const defective = getDefectiveDesks(room._id);
        const spb = Number(room.studentsPerBench) || 2;
        return normalCapacity - (defective.length * spb);
    };

    const fetchExams = async () => {
        try {
            setError("");
            const response = await API.get("/exams");
            setExams(response.data.exams || []);
        } catch (error) {
            console.error("Fetch exams error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to fetch examinations."
            );
        }
    };

    const fetchRooms = async () => {
        try {
            const response = await API.get("/rooms");
            setRooms(response.data.rooms || []);
        } catch (error) {
            console.error("Fetch rooms error:", error);
        }
    };

    useEffect(() => {
        fetchExams();
        fetchRooms();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRoomCheckbox = (roomId) => {
        setForm((prev) => {
            const exists = prev.rooms.includes(roomId);
            if (exists) {
                return {
                    ...prev,
                    rooms: prev.rooms.filter((id) => id !== roomId)
                };
            } else {
                return {
                    ...prev,
                    rooms: [...prev.rooms, roomId]
                };
            }
        });
    };

    const allRoomsSelected = rooms.length > 0 && form.rooms.length === rooms.length;

    const handleSelectAllRooms = () => {
        if (allRoomsSelected) {
            setForm((prev) => ({ ...prev, rooms: [] }));
        } else {
            setForm((prev) => ({ ...prev, rooms: rooms.map((r) => r._id) }));
        }
    };

    const toggleDefectiveDesk = (roomId, row, desk) => {
        setRoomConfigurations((prev) => {
            const existing = prev[roomId] || [];
            const idx = existing.findIndex(
                (d) => d.row === row && d.desk === desk
            );
            let updated;
            if (idx >= 0) {
                updated = existing.filter((_, i) => i !== idx);
            } else {
                updated = [...existing, { row, desk }];
            }
            return { ...prev, [roomId]: updated };
        });
    };

    const isDeskDefective = (roomId, row, desk) => {
        const desks = roomConfigurations[roomId] || [];
        return desks.some((d) => d.row === row && d.desk === desk);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !form.examName ||
            !form.subject ||
            !form.examDate ||
            !form.startTime ||
            !form.endTime ||
            !form.semester
        ) {
            setError("Please fill in all exam schedule fields.");
            return;
        }

        if (form.rooms.length === 0) {
            setError("Please select at least one examination room.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const configArray = form.rooms
                .filter((roomId) => {
                    const defective = getDefectiveDesks(roomId);
                    return defective.length > 0;
                })
                .map((roomId) => ({
                    room: roomId,
                    defectiveDesks: getDefectiveDesks(roomId)
                }));

            const payload = {
                examName: form.examName.trim(),
                subject: form.subject.trim(),
                examDate: form.examDate,
                startTime: form.startTime,
                endTime: form.endTime,
                semester: form.semester,
                departments: ["CSE"],
                rooms: form.rooms,
                studentsPerBench: 2,
                commonPaperGroups: "",
                roomConfigurations: configArray
            };

            const response = await API.post("/exams", payload);

            setMessage(
                response.data?.message ||
                "Examination scheduled successfully."
            );

            setForm({
                examName: "",
                subject: "",
                examDate: "",
                startTime: "",
                endTime: "",
                semester: "",
                rooms: []
            });

            setRoomConfigurations({});

            await fetchExams();
        } catch (error) {
            console.error("Create exam error:", error);
            setError(
                error.response?.data?.message ||
                "Failed to create examination."
            );
        } finally {
            setLoading(false);
        }
    };

    const openDeleteConfirmation = (exam) => {
        setDeleteExamId(exam._id);
        setDeleteExamName(exam.examName || "this exam");
    };

    const closeDeleteConfirmation = () => {
        setDeleteExamId(null);
        setDeleteExamName("");
    };

    const confirmDelete = async () => {
        if (!deleteExamId) return;

        try {
            setError("");
            setMessage("");

            await API.delete(`/exams/${deleteExamId}`);

            setMessage("Examination deleted successfully.");
            closeDeleteConfirmation();
            await fetchExams();
        } catch (error) {
            console.error("Delete exam error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to delete examination."
            );
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const selectedRoomsTotalCapacity = rooms
        .filter((r) => form.rooms.includes(r._id))
        .reduce((sum, r) => sum + getRoomUsableCapacity(r), 0);

    const todayDateString = new Date().toISOString().split("T")[0];

    const deskPositions = ["left", "middle", "right"];

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
                        <h2 className="page-title">Examination Management</h2>
                        <p className="page-subtitle">
                            Create and manage active examination schedules
                        </p>
                    </div>
                </div>

                {/* CREATE EXAM CARD */}
                <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                    <h3>Schedule Examination</h3>

                    <form onSubmit={handleSubmit} className="exam-form">
                        <div className="form-grid">
                            <div>
                                <label>Examination Name</label>
                                <input
                                    type="text"
                                    name="examName"
                                    placeholder="Example: Internal Assessment 1"
                                    value={form.examName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Subject / Course</label>
                                <input
                                    type="text"
                                    name="subject"
                                    placeholder="Example: Data Structures"
                                    value={form.subject}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Examination Date</label>
                                <input
                                    type="date"
                                    name="examDate"
                                    min={todayDateString}
                                    value={form.examDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Semester</label>
                                <select
                                    name="semester"
                                    value={form.semester}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Semester</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                    <option value="3">Semester 3</option>
                                    <option value="4">Semester 4</option>
                                    <option value="5">Semester 5</option>
                                    <option value="6">Semester 6</option>
                                    <option value="7">Semester 7</option>
                                    <option value="8">Semester 8</option>
                                </select>
                            </div>

                            <div>
                                <label>Start Time</label>
                                <input
                                    type="time"
                                    name="startTime"
                                    value={form.startTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>End Time</label>
                                <input
                                    type="time"
                                    name="endTime"
                                    value={form.endTime}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* ROOM SELECTION CHECKBOXES */}
                        <div className="selection-section">
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", gap: "16px" }}>
                                <div>
                                    <h4 style={{ margin: "0 0 4px 0" }}>Designate Examination Rooms</h4>
                                    <p style={{ margin: 0 }}>
                                        Selected total capacity: <strong>{selectedRoomsTotalCapacity} usable seats</strong>
                                    </p>
                                </div>

                                {rooms.length > 0 && (
                                    <label
                                        className="checkbox-item"
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "6px 14px",
                                            margin: 0,
                                            borderColor: allRoomsSelected ? "var(--primary-border)" : "var(--border-color)",
                                            background: allRoomsSelected ? "var(--primary-light)" : "var(--bg-card)",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            userSelect: "none",
                                            flexShrink: 0
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={allRoomsSelected}
                                            ref={(el) => {
                                                if (el) {
                                                    el.indeterminate = form.rooms.length > 0 && form.rooms.length < rooms.length;
                                                }
                                            }}
                                            onChange={handleSelectAllRooms}
                                            style={{ width: "15px", height: "15px", margin: 0, cursor: "pointer" }}
                                        />
                                        <div style={{ lineHeight: "1.2" }}>
                                            <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--slate-900)" }}>Select All</span>
                                            <div style={{ fontSize: "11px", color: "var(--slate-500)" }}>
                                                {rooms.length} rooms
                                            </div>
                                        </div>
                                    </label>
                                )}
                            </div>

                            <div className="checkbox-grid">
                                {rooms.map((room) => {
                                    const isChecked = form.rooms.includes(room._id);
                                    const roomCap = getRoomUsableCapacity(room);
                                    const defectiveCount = getDefectiveDesks(room._id).length;
                                    return (
                                        <div
                                            key={room._id}
                                            style={{
                                                border: `1px solid ${isChecked ? "var(--primary-border)" : "var(--border-color)"}`,
                                                background: isChecked ? "var(--primary-light)" : "var(--bg-card)",
                                                borderRadius: "8px",
                                                padding: "12px 14px"
                                            }}
                                        >
                                            <label
                                                className="checkbox-item"
                                                style={{
                                                    border: "none",
                                                    padding: 0,
                                                    margin: 0,
                                                    background: "transparent"
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => handleRoomCheckbox(room._id)}
                                                />
                                                <div>
                                                    <strong style={{ color: "var(--slate-900)" }}>{room.roomNumber}</strong>
                                                    {(room.leftDeskBenches !== undefined && room.middleDeskBenches !== undefined && room.rightDeskBenches !== undefined) ? (
                                                        <div style={{ fontSize: "12px", color: "var(--slate-500)", lineHeight: "1.5" }}>
                                                            <div>Left: {room.leftDeskBenches} benches</div>
                                                            <div>Middle: {room.middleDeskBenches} benches</div>
                                                            <div>Right: {room.rightDeskBenches} benches</div>
                                                            <div style={{ fontWeight: 600, marginTop: "2px", color: "var(--slate-700)" }}>{roomCap} usable seats</div>
                                                        </div>
                                                    ) : (
                                                        <div style={{ fontSize: "12px", color: "var(--slate-500)" }}>
                                                            {roomCap} usable seats
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                            {isChecked && (
                                                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeskModalRoom(room)}
                                                        style={{
                                                            fontSize: "12px",
                                                            padding: "4px 10px",
                                                            border: "1px solid var(--border-color)",
                                                            borderRadius: "4px",
                                                            background: defectiveCount > 0 ? "var(--danger-bg)" : "var(--bg-page)",
                                                            color: defectiveCount > 0 ? "var(--danger)" : "var(--slate-600)",
                                                            cursor: "pointer",
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        {defectiveCount > 0
                                                            ? `${defectiveCount} Desk${defectiveCount > 1 ? "s" : ""} Unavailable`
                                                            : "Configure Desk Availability"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? "Scheduling..." : "Schedule Examination"}
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

                {/* EXAM LIST TABLE */}
                <div className="dashboard-card">
                    <div className="table-header">
                        <div>
                            <h3>Active & Upcoming Examinations</h3>
                            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                                Total: <strong>{exams.length}</strong> active exams (Expired exams are removed automatically)
                            </p>
                        </div>
                    </div>

                    {exams.length === 0 ? (
                        <p style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8" }}>
                            No active examinations scheduled. Create an examination above.
                        </p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Exam Title</th>
                                        <th>Subject</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Semester</th>
                                        <th>Rooms</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {exams.map((exam) => (
                                        <tr key={exam._id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {exam.examName}
                                            </td>
                                            <td>{exam.subject}</td>
                                            <td>{new Date(exam.examDate).toLocaleDateString()}</td>
                                            <td>{exam.startTime} - {exam.endTime}</td>
                                            <td>Sem {exam.semester}</td>
                                            <td>
                                                <span className="badge-pill badge-blue">
                                                    {exam.rooms?.length || 0} Halls
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-danger"
                                                    onClick={() => openDeleteConfirmation(exam)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* DELETE CONFIRMATION MODAL */}
            {deleteExamId && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Confirm Exam Deletion</h3>
                        <p>
                            Are you sure you want to delete <strong>{deleteExamName}</strong>?
                            Any generated seating arrangements for this exam will also be cleared.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={closeDeleteConfirmation}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={confirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DESK AVAILABILITY MODAL */}
            {deskModalRoom && (() => {
                const room = deskModalRoom;
                const hasBenches =
                    room.leftDeskBenches !== undefined &&
                    room.middleDeskBenches !== undefined &&
                    room.rightDeskBenches !== undefined;
                const numRows = hasBenches
                    ? Math.max(Number(room.leftDeskBenches), Number(room.middleDeskBenches), Number(room.rightDeskBenches))
                    : (Number(room.rows) || 0);
                const positions = deskPositions;
                const defectiveCount = getDefectiveDesks(room._id).length;
                const spb = Number(room.studentsPerBench) || 2;
                const normalCap = hasBenches
                    ? (Number(room.leftDeskBenches) + Number(room.middleDeskBenches) + Number(room.rightDeskBenches)) * spb
                    : (Number(room.capacity) || 0);
                const usableCap = normalCap - (defectiveCount * spb);

                return (
                    <div className="modal-overlay">
                        <div className="modal-card" style={{ maxWidth: "520px", width: "95%" }}>
                            <h3 style={{ marginBottom: "4px" }}>Desk Availability — {room.roomNumber}</h3>
                            {hasBenches ? (
                                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#64748b" }}>
                                    Left: {room.leftDeskBenches} benches · Middle: {room.middleDeskBenches} benches · Right: {room.rightDeskBenches} benches
                                </p>
                            ) : (
                                <p style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#64748b" }}>
                                    {numRows} Rows × 3 Desks per Row
                                </p>
                            )}
                            <p style={{ margin: "0 0 16px 0", fontSize: "13px" }}>
                                Usable capacity: <strong style={{ color: defectiveCount > 0 ? "#dc2626" : "#059669" }}>{usableCap} seats</strong>
                                {defectiveCount > 0 && (
                                    <span style={{ color: "#dc2626", marginLeft: "8px" }}>
                                        ({defectiveCount} desk{defectiveCount > 1 ? "s" : ""} unavailable, −{defectiveCount * spb} seats)
                                    </span>
                                )}
                            </p>

                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                    <thead>
                                        <tr>
                                            <th style={{
                                                padding: "8px 10px",
                                                textAlign: "center",
                                                borderBottom: "2px solid #e2e8f0",
                                                color: "#475569",
                                                fontWeight: 600,
                                                fontSize: "12px"
                                            }}>
                                                Row
                                            </th>
                                            {positions.map((pos) => (
                                                <th key={pos} style={{
                                                    padding: "8px 10px",
                                                    textAlign: "center",
                                                    borderBottom: "2px solid #e2e8f0",
                                                    color: "#475569",
                                                    fontWeight: 600,
                                                    fontSize: "12px",
                                                    textTransform: "capitalize"
                                                }}>
                                                    {pos} Desk
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: numRows }, (_, i) => i + 1).map((row) => (
                                            <tr key={row}>
                                                <td style={{
                                                    padding: "6px 10px",
                                                    textAlign: "center",
                                                    borderBottom: "1px solid #f1f5f9",
                                                    fontWeight: 600,
                                                    color: "#334155"
                                                }}>
                                                    {row}
                                                </td>
                                                {positions.map((pos) => {
                                                    const isDefective = isDeskDefective(room._id, row, pos);
                                                    return (
                                                        <td key={pos} style={{
                                                            padding: "4px 6px",
                                                            textAlign: "center",
                                                            borderBottom: "1px solid #f1f5f9"
                                                        }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleDefectiveDesk(room._id, row, pos)}
                                                                style={{
                                                                    width: "38px",
                                                                    height: "32px",
                                                                    border: `2px solid ${isDefective ? "#dc2626" : "#22c55e"}`,
                                                                    borderRadius: "6px",
                                                                    background: isDefective ? "#fef2f2" : "#f0fdf4",
                                                                    color: isDefective ? "#dc2626" : "#16a34a",
                                                                    cursor: "pointer",
                                                                    fontSize: "16px",
                                                                    fontWeight: 700,
                                                                    display: "inline-flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    transition: "all 0.15s ease"
                                                                }}
                                                                title={isDefective ? "Mark as available" : "Mark as defective"}
                                                            >
                                                                {isDefective ? "✕" : "✓"}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <p style={{ margin: "14px 0 0 0", fontSize: "12px", color: "#94a3b8" }}>
                                Each desk has positions A (usable), B (empty), C (usable). A defective desk removes 2 student seats.
                            </p>

                            <div className="modal-actions" style={{ marginTop: "16px" }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => setDeskModalRoom(null)}
                                    style={{ minWidth: "100px" }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

export default Exams;