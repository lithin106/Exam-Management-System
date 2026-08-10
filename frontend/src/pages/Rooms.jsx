import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

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


    // ==========================================
    // FETCH ROOMS
    // ==========================================

    const fetchRooms = async () => {

        try {

            setError("");

            const response =
                await API.get("/rooms");

            setRooms(
                response.data.rooms || []
            );

        } catch (error) {

            console.error(
                "Fetch rooms error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to fetch rooms"
            );

        }
    };


    useEffect(() => {

        fetchRooms();

    }, []);


    // ==========================================
    // HANDLE INPUT
    // ==========================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;

        setForm({
            ...form,
            [name]: value
        });

    };


    // ==========================================
    // ADD ROOM
    // ==========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setMessage("");
        setLoading(true);


        try {

            const rows =
                Number(form.rows);

            const columns =
                Number(form.columns);


            if (
                rows <= 0 ||
                columns <= 0
            ) {

                setError(
                    "Rows and columns must be greater than zero."
                );

                setLoading(false);

                return;
            }


            const response =
                await API.post(
                    "/rooms",
                    {
                        roomNumber:
                            form.roomNumber,

                        building:
                            form.building,

                        floor:
                            form.floor,

                        rows,

                        columns
                    }
                );


            setMessage(
                response.data.message ||
                "Room created successfully."
            );


            // Clear form

            setForm({
                roomNumber: "",
                building: "",
                floor: "",
                rows: "",
                columns: ""
            });


            // Refresh rooms

            await fetchRooms();

        }

        catch (error) {

            console.error(
                "Create room error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to create room."
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ==========================================
    // DELETE ROOM
    // ==========================================

    const handleDelete = async (roomId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this room?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await API.delete(
                `/rooms/${roomId}`
            );


            setMessage(
                "Room deleted successfully."
            );


            await fetchRooms();

        }

        catch (error) {

            console.error(
                "Delete room error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to delete room."
            );

        }

    };


    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        navigate("/");

    };


    return (

        <div className="dashboard">


            {/* =====================================
                HEADER
            ===================================== */}

            <header className="topbar">

                <div>

                    <h1>
                        Exam Seating System
                    </h1>

                    <span>
                        Faculty Portal
                    </span>

                </div>


                <div className="profile">

                    <button
                        onClick={() =>
                            navigate(
                                "/faculty/dashboard"
                            )
                        }
                    >
                        Dashboard
                    </button>


                    <button
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </header>


            {/* =====================================
                MAIN
            ===================================== */}

            <main className="dashboard-content">

                <h2>
                    Examination Rooms
                </h2>

                <p>
                    Add and manage classrooms
                    used for examinations.
                </p>


                {/* =================================
                    ADD ROOM
                ================================= */}

                <div className="dashboard-card">

                    <h3>
                        Add Examination Room
                    </h3>


                    <form
                        onSubmit={handleSubmit}
                        className="room-form"
                    >

                        <div className="form-grid">


                            <div>

                                <label>
                                    Room Number
                                </label>

                                <input
                                    type="text"
                                    name="roomNumber"
                                    placeholder="Example: CSE-101"
                                    value={
                                        form.roomNumber
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Building
                                </label>

                                <input
                                    type="text"
                                    name="building"
                                    placeholder="Example: Main Block"
                                    value={
                                        form.building
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Floor
                                </label>

                                <input
                                    type="text"
                                    name="floor"
                                    placeholder="Example: 1"
                                    value={
                                        form.floor
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Rows
                                </label>

                                <input
                                    type="number"
                                    name="rows"
                                    min="1"
                                    placeholder="Example: 5"
                                    value={
                                        form.rows
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Columns
                                </label>

                                <input
                                    type="number"
                                    name="columns"
                                    min="1"
                                    placeholder="Example: 6"
                                    value={
                                        form.columns
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* CAPACITY PREVIEW */}

                        {form.rows &&
                            form.columns && (

                                <div className="capacity-preview">

                                    Capacity:{" "}

                                    <strong>
                                        {
                                            Number(
                                                form.rows
                                            ) *
                                            Number(
                                                form.columns
                                            )
                                        }
                                    </strong>

                                    {" "}seats

                                </div>

                            )}


                        <button
                            type="submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Adding Room..."
                                : "Add Room"
                            }

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


                {/* =================================
                    ROOM LIST
                ================================= */}

                <div className="dashboard-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Existing Rooms
                            </h3>

                            <p>
                                Total rooms:{" "}
                                <strong>
                                    {rooms.length}
                                </strong>
                            </p>

                        </div>


                        <button
                            onClick={fetchRooms}
                        >
                            Refresh
                        </button>

                    </div>


                    {rooms.length === 0 ? (

                        <p>
                            No examination rooms
                            found.
                        </p>

                    ) : (

                        <div className="table-container">

                            <table>

                                <thead>

                                    <tr>

                                        <th>
                                            #
                                        </th>

                                        <th>
                                            Room
                                        </th>

                                        <th>
                                            Building
                                        </th>

                                        <th>
                                            Floor
                                        </th>

                                        <th>
                                            Rows
                                        </th>

                                        <th>
                                            Columns
                                        </th>

                                        <th>
                                            Capacity
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {rooms.map(
                                        (
                                            room,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    room._id
                                                }
                                            >

                                                <td>
                                                    {
                                                        index + 1
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.roomNumber
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.building
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.floor
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.rows
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.columns
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        room.capacity
                                                    }
                                                </td>

                                                <td>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                room._id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </main>

        </div>

    );
}

export default Rooms;