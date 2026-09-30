import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Rooms() {
    const navigate = useNavigate();

    const [rooms, setRooms] = useState([]);
    const [form, setForm] = useState({
        roomNumber: "",
        building: "",
        floor: "",
        rows: "",
        columns: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [deleteRoomId, setDeleteRoomId] = useState(null);
    const [deleteRoomName, setDeleteRoomName] = useState("");

    const fetchRooms = async () => {
        try {
            setError("");
            const response = await API.get("/rooms");
            setRooms(response.data.rooms || []);
        } catch (error) {
            console.error("Fetch rooms error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to fetch rooms."
            );
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const isValidDimension = (val) => {
        if (val === undefined || val === null || val === "") return false;
        const str = String(val).trim();
        return /^[1-9]\d*$/.test(str);
    };

    const allDimensionsValid =
        isValidDimension(form.rows) &&
        isValidDimension(form.columns);

    const computeUsableSeats = (cols) => {
        const c = Number(cols) || 0;
        return c >= 6 ? 6 : c >= 4 ? 4 : c >= 2 ? 2 : c;
    };

    const usableSeats = allDimensionsValid
        ? Number(form.rows) * computeUsableSeats(form.columns)
        : 0;

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !form.roomNumber.trim() ||
            !form.building.trim() ||
            !String(form.floor).trim()
        ) {
            setError("All fields are required.");
            return;
        }

        if (!allDimensionsValid) {
            setError("Number of desk rows and seats per row must be positive whole numbers.");
            return;
        }

        const rows = Number(form.rows);
        const columns = Number(form.columns);

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await API.post("/rooms", {
                roomNumber: form.roomNumber.trim(),
                building: form.building.trim(),
                floor: String(form.floor).trim(),
                rows,
                columns
            });

            setMessage(
                response.data?.message ||
                "Room created successfully."
            );

            setForm({
                roomNumber: "",
                building: "",
                floor: "",
                rows: "",
                columns: ""
            });

            await fetchRooms();
        } catch (error) {
            console.error("Create room error:", error);
            setError(
                error.response?.data?.message ||
                "Failed to create room."
            );
        } finally {
            setLoading(false);
        }
    };

    const openDeleteModal = (room) => {
        setDeleteRoomId(room._id);
        setDeleteRoomName(room.roomNumber || "this room");
    };

    const closeDeleteModal = () => {
        setDeleteRoomId(null);
        setDeleteRoomName("");
    };

    const confirmDelete = async () => {
        if (!deleteRoomId) return;

        try {
            setError("");
            setMessage("");

            await API.delete(`/rooms/${deleteRoomId}`);

            setMessage("Room deleted successfully.");
            closeDeleteModal();
            await fetchRooms();
        } catch (error) {
            console.error("Delete room error:", error);
            setError(
                error.response?.data?.message ||
                "Unable to delete room."
            );
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

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
                        <h2 className="page-title">Examination Rooms</h2>
                        <p className="page-subtitle">
                            Configure classrooms and manage usable seating capacities
                        </p>
                    </div>
                </div>

                <div className="dashboard-card" style={{ marginBottom: "24px" }}>
                    <h3>Add Examination Room</h3>

                    <form onSubmit={handleSubmit} className="room-form">
                        <div className="form-grid">
                            <div>
                                <label>Room Code / Hall</label>
                                <input
                                    type="text"
                                    name="roomNumber"
                                    placeholder="Example: AI062F05-LH"
                                    value={form.roomNumber}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Building / Block</label>
                                <input
                                    type="text"
                                    name="building"
                                    placeholder="Example: Academic Block"
                                    value={form.building}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Floor Level</label>
                                <input
                                    type="text"
                                    name="floor"
                                    placeholder="Example: 2"
                                    value={form.floor}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label>Number of Desk Rows</label>
                                <input
                                    type="number"
                                    name="rows"
                                    placeholder="Example: 7"
                                    value={form.rows}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    required
                                />
                            </div>

                            <div>
                                <label>Seats per Row</label>
                                <input
                                    type="number"
                                    name="columns"
                                    placeholder="Example: 6"
                                    value={form.columns}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    required
                                />
                            </div>
                        </div>

                        <div className="capacity-preview" style={{ marginTop: "16px", marginBottom: "16px" }}>
                            <span className="capacity-badge" style={{ fontSize: "14px", fontWeight: 600 }}>
                                Usable Seats: {usableSeats}
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !allDimensionsValid}
                        >
                            {loading ? "Adding..." : "Add Room"}
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

                <div className="dashboard-card">
                    <div className="table-header">
                        <div>
                            <h3>Registered Examination Rooms</h3>
                            <p style={{ margin: 0, color: "#64748b", fontSize: "13px" }}>
                                Total: <strong>{rooms.length}</strong> active rooms
                            </p>
                        </div>
                    </div>

                    {rooms.length === 0 ? (
                        <p style={{ padding: "20px 0", textAlign: "center", color: "#94a3b8" }}>
                            No rooms added yet. Create a room above.
                        </p>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Room Code</th>
                                        <th>Building</th>
                                        <th>Floor</th>
                                        <th>Rows</th>
                                        <th>Seats per Row</th>
                                        <th>Usable Capacity</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rooms.map((room) => {
                                        return (
                                            <tr key={room._id}>
                                                <td style={{ fontWeight: 600 }}>
                                                    {room.roomNumber}
                                                </td>
                                                <td>{room.building}</td>
                                                <td>Floor {room.floor}</td>
                                                <td>{room.rows || "-"}</td>
                                                <td>{room.columns || "-"}</td>
                                                <td>
                                                    <span className="badge-pill badge-blue">
                                                        Usable Seats: {room.capacity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => openDeleteModal(room)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {deleteRoomId && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        <h3>Confirm Room Deletion</h3>
                        <p>
                            Are you sure you want to delete room <strong>{deleteRoomName}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={closeDeleteModal}
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
        </div>
    );
}

export default Rooms;