import { useNavigate } from "react-router-dom";

function StudentDashboard() {

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
                        Student Portal
                    </span>
                </div>


                <button onClick={logout}>
                    Logout
                </button>

            </header>


            <main className="dashboard-content">

                <h2>
                    Welcome, {user?.name}
                </h2>

                <p>
                    View your examination and
                    seating information.
                </p>


                <div className="dashboard-card">

                    <h3>
                        My Examination
                    </h3>

                    <p>
                        View your examination,
                        classroom and seat
                        information.
                    </p>

                    <button
                        onClick={() =>
                            navigate(
                                "/student/exam"
                            )
                        }
                    >
                        View Exam Details
                    </button>

                </div>

            </main>

        </div>

    );
}

export default StudentDashboard;