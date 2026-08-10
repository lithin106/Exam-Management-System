import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function SeatingPlan() {

    const navigate = useNavigate();

    const [exams, setExams] = useState([]);

    const [selectedExam, setSelectedExam] = useState("");

    const [seating, setSeating] = useState([]);

    const [statistics, setStatistics] = useState(null);

    const [loading, setLoading] = useState(false);

    const [loadingPlan, setLoadingPlan] = useState(false);

    const [loadingExams, setLoadingExams] = useState(true);

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");


    // =====================================================
    // FETCH SAVED EXAMS FROM MONGODB
    // =====================================================

    const fetchExams = async () => {

        try {

            setLoadingExams(true);

            setError("");

            const response =
                await API.get("/exams");


            if (response.data.success) {

                setExams(
                    response.data.exams || []
                );

            } else {

                setExams([]);

                setError(
                    "No examinations found."
                );

            }

        } catch (error) {

            console.error(
                "Fetch exams error:",
                error
            );


            setExams([]);


            if (
                error.response?.status === 401
            ) {

                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

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


    // =====================================================
    // LOAD EXAMS WHEN PAGE OPENS
    // =====================================================

    useEffect(() => {

        fetchExams();

    }, []);


    // =====================================================
    // GENERATE SEATING
    // =====================================================

    const generateSeating = async () => {

        if (!selectedExam) {

            setError(
                "Please select an examination."
            );

            return;

        }


        try {

            setLoading(true);

            setError("");

            setMessage("");

            setSeating([]);

            setStatistics(null);


            // ---------------------------------------------
            // STEP 1: GENERATE
            // ---------------------------------------------

            const response =
                await API.post(
                    "/seating/generate",
                    {
                        examId:
                            selectedExam
                    }
                );


            setMessage(
                response.data.message ||
                "Seating plan generated successfully."
            );


            setStatistics(
                response.data.statistics ||
                null
            );


            // ---------------------------------------------
            // STEP 2: FETCH SAVED PLAN
            // ---------------------------------------------
            //
            // This gets populated Student + Room data
            // from MongoDB.
            //

            const seatingResponse =
                await API.get(
                    `/seating/${selectedExam}`
                );


            setSeating(
                seatingResponse.data.assignments ||
                []
            );


        } catch (error) {

            console.error(
                "Generate seating error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to generate seating plan."
            );


            setSeating([]);

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // VIEW EXISTING SEATING PLAN
    // =====================================================

    const viewExistingPlan = async () => {

        if (!selectedExam) {

            setError(
                "Please select an examination."
            );

            return;

        }


        try {

            setLoadingPlan(true);

            setError("");

            setMessage("");

            setStatistics(null);


            const response =
                await API.get(
                    `/seating/${selectedExam}`
                );


            const assignments =
                response.data.assignments ||
                [];


            setSeating(
                assignments
            );


            if (
                assignments.length === 0
            ) {

                setMessage(
                    "No seating plan has been generated for this examination yet."
                );

            } else {

                setMessage(
                    "Existing seating plan loaded successfully."
                );

            }


        } catch (error) {

            console.error(
                "View seating error:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to load seating plan."
            );


        } finally {

            setLoadingPlan(false);

        }

    };
    // =====================================================
// DOWNLOAD PDF
// =====================================================

const downloadPDF = async () => {

    if (!selectedExam) {

        setError(
            "Please select an examination."
        );

        return;

    }


    try {

        setError("");

        setMessage(
            "Preparing PDF..."
        );


        const response =
            await API.get(
                `/seating/${selectedExam}/pdf`,
                {
                    responseType:
                        "blob"
                }
            );


        // ------------------------------------------------
        // CREATE DOWNLOAD URL
        // ------------------------------------------------

        const blob =
            new Blob(
                [
                    response.data
                ],
                {
                    type:
                        "application/pdf"
                }
            );


        const url =
            window.URL.createObjectURL(
                blob
            );


        // ------------------------------------------------
        // CREATE DOWNLOAD LINK
        // ------------------------------------------------

        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            "Seating_Plan.pdf";


        document.body.appendChild(
            link
        );


        link.click();


        // ------------------------------------------------
        // CLEAN UP
        // ------------------------------------------------

        link.remove();

        window.URL.revokeObjectURL(
            url
        );


        setMessage(
            "PDF downloaded successfully."
        );

    }

    catch (error) {

        console.error(
            "PDF download error:",
            error
        );


        setError(
            error.response?.data?.message ||
            "Unable to download PDF."
        );

    }

    };

    // =====================================================
    // GROUP ASSIGNMENTS BY ROOM
    // =====================================================

    const groupByRoom = () => {

        const grouped = {};


        seating.forEach(
            assignment => {

                const roomId =
                    assignment.room?._id ||
                    assignment.room;


                if (!roomId) {
                    return;
                }


                if (!grouped[roomId]) {

                    grouped[roomId] = [];

                }


                grouped[roomId].push(
                    assignment
                );

            }
        );


        return grouped;

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "user"
        );

        navigate("/");

    };


    const groupedRooms =
        groupByRoom();


    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "";
        }


        return new Date(
            date
        ).toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };


    return (

        <div className="dashboard">


            {/* =================================================
                HEADER
            ================================================= */}

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


            {/* =================================================
                MAIN
            ================================================= */}

            <main className="dashboard-content">

                <h2>
                    Seating Arrangement
                </h2>

                <p>
                    Generate and manage examination
                    seating arrangements.
                </p>


                {/* =================================================
                    EXAM SELECTION
                ================================================= */}

                <div className="dashboard-card">

                    <h3>
                        Select Examination
                    </h3>


                    {loadingExams ? (

                        <p>
                            Loading examinations...
                        </p>

                    ) : (

                        <select
                            value={
                                selectedExam
                            }
                            onChange={
                                (event) => {

                                    setSelectedExam(
                                        event.target.value
                                    );

                                    setSeating([]);

                                    setStatistics(
                                        null
                                    );

                                    setMessage("");

                                    setError("");

                                }
                            }
                        >

                            <option value="">
                                -- Select Examination --
                            </option>


                            {exams.map(
                                exam => (

                                    <option
                                        key={
                                            exam._id
                                        }
                                        value={
                                            exam._id
                                        }
                                    >

                                        {exam.examName}

                                        {" | "}

                                        {exam.subject}

                                        {" | "}

                                        {formatDate(
                                            exam.examDate
                                        )}

                                    </option>

                                )
                            )}

                        </select>

                    )}


                    {!loadingExams &&
                        exams.length === 0 && (

                            <p
                                style={{
                                    marginTop:
                                        "15px"
                                }}
                            >
                                No saved examinations
                                found. Create an
                                examination first.
                            </p>

                        )}


                    {/* =================================================
                        BUTTONS
                    ================================================= */}

                    <div
        className="action-buttons"
    >

        <button
            onClick={
                generateSeating
            }
            disabled={
                loading ||
                loadingExams ||
                !selectedExam
            }
        >

            {loading
                ? "Generating..."
                : "Generate Seating"
            }

        </button>


        <button
            onClick={
                viewExistingPlan
            }
            disabled={
                loadingPlan ||
                loadingExams ||
                !selectedExam
            }
        >

            {loadingPlan
                ? "Loading..."
                : "View Existing Plan"
            }

        </button>


        <button
            onClick={
            downloadPDF
        }
        disabled={
            !selectedExam ||
            seating.length === 0
                     }
                      >

                      Download PDF

                      </button>


                      <button
                      onClick={
                     fetchExams
                     }
                      disabled={
                      loadingExams
                   }
                   >

                      Refresh Exams

                      </button>

                        </div>


                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {message && (

                        <div
                            className="success-message"
                            style={{
                                marginTop:
                                    "15px"
                            }}
                        >

                            {message}

                        </div>

                    )}


                    {/* =================================================
                        ERROR MESSAGE
                    ================================================= */}

                    {error && (

                        <div
                            className="error-message"
                            style={{
                                marginTop:
                                    "15px"
                            }}
                        >

                            {error}

                        </div>

                    )}

                </div>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                {statistics && (

                    <div
                        className="statistics-grid"
                    >

                        <div
                            className="stat-card"
                        >

                            <h3>
                                {
                                    statistics.totalStudents
                                }
                            </h3>

                            <p>
                                Total Students
                            </p>

                        </div>


                        <div
                            className="stat-card"
                        >

                            <h3>
                                {
                                    statistics.assignedStudents
                                }
                            </h3>

                            <p>
                                Assigned
                            </p>

                        </div>


                        <div
                            className="stat-card"
                        >

                            <h3>
                                {
                                    statistics.unassignedStudents
                                }
                            </h3>

                            <p>
                                Unassigned
                            </p>

                        </div>


                        <div
                            className="stat-card"
                        >

                            <h3>
                                {
                                    statistics.totalSeats
                                }
                            </h3>

                            <p>
                                Total Seats
                            </p>

                        </div>


                        <div
                            className="stat-card"
                        >

                            <h3>
                                {
                                    statistics.usedRooms ??
                                    "-"
                                }
                            </h3>

                            <p>
                                Rooms Used
                            </p>

                        </div>

                    </div>

                )}


                {/* =================================================
                    SEATING PLAN
                ================================================= */}

                {seating.length > 0 && (

                    <div>

                        <h3
                            className="section-title"
                        >
                            Generated Seating Plan
                        </h3>


                        {Object.entries(
                            groupedRooms
                        ).map(
                            (
                                [
                                    roomId,
                                    assignments
                                ]
                            ) => {

                                const room =
                                    assignments[0]
                                        ?.room;


                                return (

                                    <div
                                        className="dashboard-card room-card"
                                        key={
                                            roomId
                                        }
                                    >

                                        {/* ROOM HEADER */}

                                        <div
                                            className="room-header"
                                        >

                                            <div>

                                                <h3>

                                                    {
                                                        room?.roomNumber ||
                                                        "Examination Room"
                                                    }

                                                </h3>


                                                <p>

                                                    {
                                                        room?.building ||
                                                        ""
                                                    }

                                                    {room?.floor
                                                        ? ` • Floor ${room.floor}`
                                                        : ""
                                                    }

                                                </p>

                                            </div>


                                            <div>

                                                <strong>
                                                    {
                                                        assignments.length
                                                    }
                                                </strong>

                                                {" "}
                                                students

                                            </div>

                                        </div>


                                        {/* ROOM TABLE */}

                                        <div
                                            className="table-container"
                                        >

                                            <table>

                                                <thead>

                                                    <tr>

                                                        <th>
                                                            Seat
                                                        </th>

                                                        <th>
                                                            Student ID
                                                        </th>

                                                        <th>
                                                            Student Name
                                                        </th>

                                                        <th>
                                                            Department
                                                        </th>

                                                        <th>
                                                            Row
                                                        </th>

                                                        <th>
                                                            Column
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {[
                                                        ...assignments
                                                    ]
                                                        .sort(
                                                            (
                                                                a,
                                                                b
                                                            ) => {

                                                                if (
                                                                    a.row !==
                                                                    b.row
                                                                ) {

                                                                    return (
                                                                        a.row -
                                                                        b.row
                                                                    );

                                                                }


                                                                return (
                                                                    a.column -
                                                                    b.column
                                                                );

                                                            }
                                                        )
                                                        .map(
                                                            assignment => (

                                                                <tr
                                                                    key={
                                                                        assignment._id
                                                                    }
                                                                >

                                                                    <td>

                                                                        <strong>
                                                                            {
                                                                                assignment.seatNumber
                                                                            }
                                                                        </strong>

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            assignment.student?.studentId ||
                                                                            assignment.studentId ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            assignment.student?.name ||
                                                                            assignment.studentName ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            assignment.student?.department ||
                                                                            assignment.department ||
                                                                            "-"
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            assignment.row
                                                                        }

                                                                    </td>


                                                                    <td>

                                                                        {
                                                                            assignment.column
                                                                        }

                                                                    </td>

                                                                </tr>

                                                            )
                                                        )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                );

                            }
                        )}

                    </div>

                )}


                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {seating.length === 0 &&
                    !loading &&
                    !loadingExams && (

                        <div
                            className="dashboard-card"
                        >

                            <h3>
                                No Seating Plan Loaded
                            </h3>

                            <p>

                                Select an examination
                                and click
                                <strong>
                                    {" Generate Seating "}
                                </strong>
                                to create the arrangement.

                            </p>

                        </div>

                    )}

            </main>

        </div>

    );

}


export default SeatingPlan;