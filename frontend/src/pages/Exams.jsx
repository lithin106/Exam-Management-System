import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

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
        departments: [],
        rooms: []
    });

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");


    // ==========================================
    // FETCH EXAMS
    // ==========================================

    const fetchExams = async () => {

        try {

            const response =
                await API.get("/exams");

            setExams(
                response.data.exams || []
            );

        } catch (error) {

            console.error(
                "Fetch exams error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to fetch examinations"
            );

        }

    };


    // ==========================================
    // FETCH ROOMS
    // ==========================================

    const fetchRooms = async () => {

        try {

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


    // ==========================================
    // LOAD DATA
    // ==========================================

    useEffect(() => {

        fetchExams();

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
    // DEPARTMENT SELECTION
    // ==========================================

    const toggleDepartment = (department) => {

        if (
            form.departments.includes(
                department
            )
        ) {

            setForm({
                ...form,
                departments:
                    form.departments.filter(
                        item =>
                            item !== department
                    )
            });

        } else {

            setForm({
                ...form,
                departments: [
                    ...form.departments,
                    department
                ]
            });

        }

    };


    // ==========================================
    // ROOM SELECTION
    // ==========================================

    const toggleRoom = (roomId) => {

        if (
            form.rooms.includes(roomId)
        ) {

            setForm({
                ...form,
                rooms:
                    form.rooms.filter(
                        id =>
                            id !== roomId
                    )
            });

        } else {

            setForm({
                ...form,
                rooms: [
                    ...form.rooms,
                    roomId
                ]
            });

        }

    };


    // ==========================================
    // CREATE EXAM
    // ==========================================

    const handleSubmit = async (event) => {

        event.preventDefault();

        setError("");
        setMessage("");


        if (
            form.departments.length === 0
        ) {

            setError(
                "Please select at least one department."
            );

            return;

        }


        if (
            form.rooms.length === 0
        ) {

            setError(
                "Please select at least one examination room."
            );

            return;

        }


        try {

            setLoading(true);


            const response =
                await API.post(
                    "/exams",
                    {
                        examName:
                            form.examName,

                        subject:
                            form.subject,

                        examDate:
                            form.examDate,

                        startTime:
                            form.startTime,

                        endTime:
                            form.endTime,

                        semester:
                            Number(
                                form.semester
                            ),

                        departments:
                            form.departments,

                        rooms:
                            form.rooms
                    }
                );


            setMessage(
                response.data.message ||
                "Examination created successfully."
            );


            // Reset form

            setForm({
                examName: "",
                subject: "",
                examDate: "",
                startTime: "",
                endTime: "",
                semester: "",
                departments: [],
                rooms: []
            });


            // Refresh exams

            await fetchExams();

        }

        catch (error) {

            console.error(
                "Create exam error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to create examination."
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ==========================================
    // DELETE EXAM
    // ==========================================

    const handleDelete = async (examId) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this examination?"
            );


        if (!confirmed) {
            return;
        }


        try {

            await API.delete(
                `/exams/${examId}`
            );


            setMessage(
                "Examination deleted successfully."
            );


            await fetchExams();

        }

        catch (error) {

            console.error(
                "Delete exam error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to delete examination."
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


            <main className="dashboard-content">

                <h2>
                    Examination Management
                </h2>

                <p>
                    Create and manage examination
                    schedules and seating resources.
                </p>


                {/* =================================
                    CREATE EXAMINATION
                ================================= */}

                <div className="dashboard-card">

                    <h3>
                        Create Examination
                    </h3>


                    <form
                        onSubmit={handleSubmit}
                        className="exam-form"
                    >

                        <div className="form-grid">


                            <div>

                                <label>
                                    Examination Name
                                </label>

                                <input
                                    type="text"
                                    name="examName"
                                    placeholder="Example: Internal Assessment 1"
                                    value={
                                        form.examName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Subject
                                </label>

                                <input
                                    type="text"
                                    name="subject"
                                    placeholder="Example: Data Structures"
                                    value={
                                        form.subject
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Examination Date
                                </label>

                                <input
                                    type="date"
                                    name="examDate"
                                    value={
                                        form.examDate
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Semester
                                </label>

                                <input
                                    type="number"
                                    name="semester"
                                    min="1"
                                    max="8"
                                    placeholder="Example: 6"
                                    value={
                                        form.semester
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    Start Time
                                </label>

                                <input
                                    type="time"
                                    name="startTime"
                                    value={
                                        form.startTime
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>


                            <div>

                                <label>
                                    End Time
                                </label>

                                <input
                                    type="time"
                                    name="endTime"
                                    value={
                                        form.endTime
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                            </div>

                        </div>


                        {/* =================================
                            DEPARTMENTS
                        ================================= */}

                        <div className="selection-section">

                            <h4>
                                Departments
                            </h4>

                            <p>
                                Select departments
                                whose students can
                                attend this examination.
                            </p>


                            <div className="checkbox-grid">

                                {[
                                    "CSE",
                                    "ISE",
                                    "ECE",
                                    "EEE",
                                    "ME",
                                    "CIVIL",
                                    "AIML",
                                    "DS"
                                ].map(
                                    department => (

                                        <label
                                            key={
                                                department
                                            }
                                            className="checkbox-item"
                                        >

                                            <input
                                                type="checkbox"
                                                checked={
                                                    form.departments.includes(
                                                        department
                                                    )
                                                }
                                                onChange={() =>
                                                    toggleDepartment(
                                                        department
                                                    )
                                                }
                                            />

                                            {department}

                                        </label>

                                    )
                                )}

                            </div>

                        </div>


                        {/* =================================
                            ROOMS
                        ================================= */}

                        <div className="selection-section">

                            <h4>
                                Examination Rooms
                            </h4>

                            <p>
                                Select the classrooms
                                available for this exam.
                            </p>


                            {rooms.length === 0 ? (

                                <p>
                                    No rooms available.
                                    Please create rooms first.
                                </p>

                            ) : (

                                <div className="checkbox-grid">

                                    {rooms.map(
                                        room => (

                                            <label
                                                key={
                                                    room._id
                                                }
                                                className="checkbox-item"
                                            >

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        form.rooms.includes(
                                                            room._id
                                                        )
                                                    }
                                                    onChange={() =>
                                                        toggleRoom(
                                                            room._id
                                                        )
                                                    }
                                                />

                                                <span>

                                                    {
                                                        room.roomNumber
                                                    }

                                                    {" — "}

                                                    {
                                                        room.capacity
                                                    }

                                                    {" seats"}

                                                </span>

                                            </label>

                                        )
                                    )}

                                </div>

                            )}

                        </div>


                        <button
                            type="submit"
                            disabled={loading}
                        >

                            {loading
                                ? "Creating Examination..."
                                : "Create Examination"
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
                    EXISTING EXAMS
                ================================= */}

                <div className="dashboard-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Existing Examinations
                            </h3>

                            <p>
                                Total examinations:{" "}
                                <strong>
                                    {exams.length}
                                </strong>
                            </p>

                        </div>


                        <button
                            onClick={fetchExams}
                        >
                            Refresh
                        </button>

                    </div>


                    {exams.length === 0 ? (

                        <p>
                            No examinations found.
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
                                            Examination
                                        </th>

                                        <th>
                                            Subject
                                        </th>

                                        <th>
                                            Date
                                        </th>

                                        <th>
                                            Time
                                        </th>

                                        <th>
                                            Semester
                                        </th>

                                        <th>
                                            Rooms
                                        </th>

                                        <th>
                                            Action
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {exams.map(
                                        (
                                            exam,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    exam._id
                                                }
                                            >

                                                <td>
                                                    {
                                                        index + 1
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.examName
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.subject
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.examDate
                                                            ? new Date(
                                                                exam.examDate
                                                            ).toLocaleDateString()
                                                            : "-"
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.startTime
                                                    }

                                                    {" - "}

                                                    {
                                                        exam.endTime
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.semester
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        exam.rooms?.length ||
                                                        0
                                                    }
                                                </td>

                                                <td>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                exam._id
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

export default Exams;