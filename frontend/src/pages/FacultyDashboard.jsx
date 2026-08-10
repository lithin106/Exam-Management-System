import { useNavigate } from "react-router-dom";

function FacultyDashboard() {

    const navigate = useNavigate();

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );


    const logout = () => {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/");

    };


    return (

        <div className="dashboard">

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

                    <span>
                        {user?.name}
                    </span>

                    <button onClick={logout}>
                        Logout
                    </button>

                </div>

            </header>


            <main className="dashboard-content">

                <h2>
                    Faculty Dashboard
                </h2>

                <p>
                    Manage students, rooms,
                    examinations and seating
                    arrangements.
                </p>


                <div className="dashboard-grid">

                    <div className="dashboard-card">

                        <h3>
                            Students
                        </h3>

                        <p>
                            Upload and manage
                            student information.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/faculty/students"
                                )
                            }
                        >
                            Manage Students
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <h3>
                            Examination Rooms
                        </h3>

                        <p>
                            Manage classrooms and
                            seating capacity.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/faculty/rooms"
                                )
                            }
                        >
                            Manage Rooms
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <h3>
                            Examinations
                        </h3>

                        <p>
                            Create and manage
                            examinations.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/faculty/exams"
                                )
                            }
                        >
                            Manage Exams
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <h3>
                            Seating Arrangement
                        </h3>

                        <p>
                            Generate automated
                            examination seating.
                        </p>

                        <button
                            onClick={() =>
                                navigate(
                                    "/faculty/seating"
                                )
                            }
                        >
                            Generate Seating
                        </button>

                    </div>

                </div>

            </main>

        </div>

    );
}

export default FacultyDashboard;