import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Students from "./pages/Students";
import Rooms from "./pages/Rooms";
import Exams from "./pages/Exams";
import SeatingPlan from "./pages/SeatingPlan";
import FacultyAllocation from "./pages/FacultyAllocation";

function ProtectedRoute({ children, allowedRole }) {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
        return <Navigate to="/" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        if (allowedRole && user.role !== allowedRole) {
            return <Navigate to="/" replace />;
        }
        return children;
    } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/" replace />;
    }
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/faculty/dashboard"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <FacultyDashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/students"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <Students />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/rooms"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <Rooms />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/exams"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <Exams />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/seating"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <SeatingPlan />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/faculty/allocation"
                    element={
                        <ProtectedRoute allowedRole="faculty">
                            <FacultyAllocation />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/student/dashboard"
                    element={
                        <ProtectedRoute allowedRole="student">
                            <StudentDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;