import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Students from "./pages/Students";
import Rooms from "./pages/Rooms";
import Exams from "./pages/Exams";
import SeatingPlan from "./pages/SeatingPlan";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* LOGIN */}

                <Route
                    path="/"
                    element={<Login />}
                />


                {/* FACULTY DASHBOARD */}

                <Route
                    path="/faculty/dashboard"
                    element={
                        <FacultyDashboard />
                    }
                />


                {/* STUDENT MANAGEMENT */}

                <Route
                    path="/faculty/students"
                    element={
                        <Students />
                    }
                />


                {/* ROOM MANAGEMENT */}

                <Route
                    path="/faculty/rooms"
                    element={
                        <Rooms />
                    }
                />


                {/* EXAM MANAGEMENT */}

                <Route
                    path="/faculty/exams"
                    element={
                        <Exams />
                    }
                />


                {/* SEATING ARRANGEMENT */}

                <Route
                    path="/faculty/seating"
                    element={
                        <SeatingPlan />
                    }
                />


                {/* STUDENT DASHBOARD */}

                <Route
                    path="/student/dashboard"
                    element={
                        <StudentDashboard />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;