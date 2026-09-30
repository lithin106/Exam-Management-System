import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

function Login() {
    const navigate = useNavigate();

    const [isRegister, setIsRegister] = useState(false);
    const [role, setRole] = useState("faculty");
    const [name, setName] = useState("");
    const [facultyId, setFacultyId] = useState("");
    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");
        setLoading(true);

        try {
            if (isRegister) {
                // REGISTRATION
                if (role === "faculty" && !facultyId.trim()) {
                    setError("Faculty ID is mandatory to register as faculty.");
                    setLoading(false);
                    return;
                }

                if (role === "student" && !studentId.trim()) {
                    setError("Student USN / ID is mandatory to register as a student.");
                    setLoading(false);
                    return;
                }

                const payload = {
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    role,
                    facultyId: role === "faculty" ? facultyId.trim() : undefined,
                    studentId: role === "student" ? studentId.trim() : undefined
                };

                const response = await API.post("/auth/register", payload);

                setSuccessMessage(
                    response.data?.message ||
                    "Account registered successfully. Please sign in below."
                );
                setIsRegister(false);
                setPassword("");
            } else {
                // LOGIN
                const response = await API.post("/auth/login", {
                    email: email.trim(),
                    password
                });

                const { token, user } = response.data;

                if (user.role !== role) {
                    setError(`This account is registered as ${user.role}.`);
                    setLoading(false);
                    return;
                }

                localStorage.setItem("token", token);
                localStorage.setItem("user", JSON.stringify(user));

                if (user.role === "faculty") {
                    navigate("/faculty/dashboard");
                } else {
                    navigate("/student/dashboard");
                }
            }
        } catch (error) {
            console.error("Auth error:", error);
            setError(
                error.response?.data?.message ||
                (isRegister ? "Registration failed. Please check your details." : "Invalid email or password.")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: "20px", right: "24px" }}>
                <ThemeToggle />
            </div>

            <div className="login-card">
                <h1>Exam Management System</h1>
                <p className="subtitle">
                    {isRegister ? "Create Account" : "Examination Management Portal"}
                </p>

                {/* ROLE SELECTION */}
                <div className="role-selector">
                    <button
                        type="button"
                        className={role === "faculty" ? "role-btn active" : "role-btn"}
                        onClick={() => {
                            setRole("faculty");
                            setError("");
                        }}
                    >
                        Faculty
                    </button>

                    <button
                        type="button"
                        className={role === "student" ? "role-btn active" : "role-btn"}
                        onClick={() => {
                            setRole("student");
                            setError("");
                        }}
                    >
                        Student
                    </button>
                </div>

                {/* AUTH FORM */}
                <form onSubmit={handleSubmit}>
                    {isRegister && (
                        <>
                            <label>Full Name</label>
                            <input
                                type="text"
                                placeholder="Enter full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />

                            {role === "faculty" && (
                                <>
                                    <label>Faculty ID</label>
                                    <input
                                        type="text"
                                        placeholder="Example: FAC-CSE-102"
                                        value={facultyId}
                                        onChange={(e) => setFacultyId(e.target.value)}
                                        required
                                    />
                                </>
                            )}

                            {role === "student" && (
                                <>
                                    <label>Student USN / ID</label>
                                    <input
                                        type="text"
                                        placeholder="Example: 1AY23CS001"
                                        value={studentId}
                                        onChange={(e) => setStudentId(e.target.value)}
                                        required
                                    />
                                </>
                            )}
                        </>
                    )}

                    <label>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {successMessage && (
                        <div className="success-message">
                            {successMessage}
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading
                            ? "Processing..."
                            : isRegister
                                ? `Register as ${role === "faculty" ? "Faculty" : "Student"}`
                                : `Sign In as ${role === "faculty" ? "Faculty" : "Student"}`
                        }
                    </button>
                </form>

                {/* TOGGLE SIGN IN / REGISTER */}
                <div style={{ marginTop: "20px", textAlign: "center", fontSize: "13px", color: "var(--slate-500)" }}>
                    {isRegister ? (
                        <span>
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(false);
                                    setError("");
                                    setSuccessMessage("");
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--primary)",
                                    fontWeight: 700,
                                    padding: 0,
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                }}
                            >
                                Sign In
                            </button>
                        </span>
                    ) : (
                        <span>
                            New {role === "faculty" ? "faculty member" : "student"}?{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsRegister(true);
                                    setError("");
                                    setSuccessMessage("");
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--primary)",
                                    fontWeight: 700,
                                    padding: 0,
                                    cursor: "pointer",
                                    textDecoration: "underline"
                                }}
                            >
                                Create Account
                            </button>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;