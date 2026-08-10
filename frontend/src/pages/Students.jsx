import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Students() {

    const navigate = useNavigate();

    const [students, setStudents] = useState([]);

    const [file, setFile] = useState(null);

    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState("");


    // ==========================================
    // FETCH STUDENTS
    // ==========================================

    const fetchStudents = async () => {

        try {

            setError("");

            const response =
                await API.get("/student");

            setStudents(
                response.data.students || []
            );

        } catch (error) {

            console.error(
                "Fetch students error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to fetch students"
            );

        }
    };


    // ==========================================
    // LOAD STUDENTS WHEN PAGE OPENS
    // ==========================================

    useEffect(() => {

        fetchStudents();

    }, []);


    // ==========================================
    // FILE SELECTION
    // ==========================================

    const handleFileChange = (event) => {

        const selectedFile =
            event.target.files[0];

        setFile(selectedFile);

        setMessage("");

        setError("");

    };


    // ==========================================
    // UPLOAD EXCEL
    // ==========================================

    const handleUpload = async () => {

        if (!file) {

            setError(
                "Please select an Excel file first."
            );

            return;
        }


        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );


        try {

            setLoading(true);

            setMessage("");

            setError("");


            const response =
                await API.post(
                    "/student/upload",
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data"
                        }
                    }
                );


            setMessage(
                response.data.message ||
                "Students uploaded successfully."
            );


            // Refresh student table
            await fetchStudents();


            // Clear selected file
            setFile(null);

            document.getElementById(
                "student-file"
            ).value = "";


        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Student upload failed."
            );

        } finally {

            setLoading(false);

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

            {/* =================================
                HEADER
            ================================= */}

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


            {/* =================================
                CONTENT
            ================================= */}

            <main className="dashboard-content">

                <h2>
                    Student Management
                </h2>

                <p>
                    Upload student information
                    using an Excel spreadsheet.
                </p>


                {/* =================================
                    UPLOAD CARD
                ================================= */}

                <div className="dashboard-card">

                    <h3>
                        Upload Student Excel
                    </h3>

                    <p>
                        Select the Excel file
                        containing student
                        information.
                    </p>


                    <input
                        id="student-file"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={
                            handleFileChange
                        }
                    />


                    {file && (

                        <p>
                            Selected file:{" "}
                            <strong>
                                {file.name}
                            </strong>
                        </p>

                    )}


                    <button
                        onClick={
                            handleUpload
                        }
                        disabled={loading}
                    >

                        {loading
                            ? "Uploading..."
                            : "Upload Students"
                        }

                    </button>


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
                    STUDENT TABLE
                ================================= */}

                <div className="dashboard-card">

                    <div className="table-header">

                        <div>

                            <h3>
                                Students
                            </h3>

                            <p>
                                Total students:{" "}
                                <strong>
                                    {students.length}
                                </strong>
                            </p>

                        </div>


                        <button
                            onClick={
                                fetchStudents
                            }
                        >
                            Refresh
                        </button>

                    </div>


                    {students.length === 0 ? (

                        <p>
                            No students found.
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
                                            Student ID
                                        </th>

                                        <th>
                                            Name
                                        </th>

                                        <th>
                                            Department
                                        </th>

                                        <th>
                                            Semester
                                        </th>

                                        <th>
                                            Eligibility
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {students.map(
                                        (
                                            student,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    student._id ||
                                                    index
                                                }
                                            >

                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    {
                                                        student.studentId
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.department
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        student.semester
                                                    }
                                                </td>

                                                <td>

                                                    {student.isEligible
                                                        ? "Eligible"
                                                        : "Not Eligible"
                                                    }

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

export default Students;