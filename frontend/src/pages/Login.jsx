import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Login() {

    const navigate = useNavigate();

    const [role, setRole] =
        useState("faculty");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState("");

    const [loading, setLoading] =
        useState(false);


    const handleLogin = async (event) => {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response =
                await API.post(
                    "/auth/login",
                    {
                        email,
                        password
                    }
                );

            const {
                token,
                user
            } = response.data;


            // Make sure the selected
            // login type matches the account
            if (user.role !== role) {

                setError(
                    `This account is registered as ${user.role}.`
                );

                setLoading(false);

                return;
            }


            // Store login information
            localStorage.setItem(
                "token",
                token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(user)
            );


            // Redirect according to role
            if (user.role === "faculty") {

                navigate(
                    "/faculty/dashboard"
                );

            } else {

                navigate(
                    "/student/dashboard"
                );

            }

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Invalid email or password"
            );

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="login-page">

            <div className="login-card">

                <h1>
                    Exam Seating System
                </h1>

                <p className="subtitle">
                    Examination Management Portal
                </p>


                {/* ROLE SELECTION */}

                <div className="role-selector">

                    <button
                        type="button"
                        className={
                            role === "faculty"
                                ? "role-btn active"
                                : "role-btn"
                        }
                        onClick={() =>
                            setRole("faculty")
                        }
                    >
                        Faculty
                    </button>


                    <button
                        type="button"
                        className={
                            role === "student"
                                ? "role-btn active"
                                : "role-btn"
                        }
                        onClick={() =>
                            setRole("student")
                        }
                    >
                        Student
                    </button>

                </div>


                {/* LOGIN FORM */}

                <form
                    onSubmit={handleLogin}
                >

                    <label>
                        Email
                    </label>

                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(event) =>
                            setEmail(
                                event.target.value
                            )
                        }
                        required
                    />


                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) =>
                            setPassword(
                                event.target.value
                            )
                        }
                        required
                    />


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
                            ? "Signing in..."
                            : `Login as ${role}`
                        }
                    </button>

                </form>

            </div>

        </div>

    );
}

export default Login;