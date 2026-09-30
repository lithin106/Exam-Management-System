const User = require("../models/User");
const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            role,
            studentId,
            facultyId
        } = req.body;

        if (!["faculty", "student"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role"
            });
        }

        if (role === "faculty") {
            if (!facultyId || String(facultyId).trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Faculty ID is mandatory to register a faculty account."
                });
            }
        }

        if (role === "student") {
            if (!studentId || String(studentId).trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Student USN / ID is mandatory to register a student account."
                });
            }

            const studentRecord = await Student.findOne({
                studentId: String(studentId).trim().toUpperCase()
            });

            if (!studentRecord) {
                return res.status(400).json({
                    success: false,
                    message: "This USN is not found in the system. Please contact your department coordinator."
                });
            }

            const existingStudentAccount = await User.findOne({
                studentId: String(studentId).trim().toUpperCase(),
                role: "student"
            });

            if (existingStudentAccount) {
                return res.status(400).json({
                    success: false,
                    message: "An account already exists for this USN."
                });
            }
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            studentId: role === "student" ? String(studentId).trim().toUpperCase() : null,
            facultyId: role === "faculty" ? facultyId : null
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ==========================
// LOGIN USER
// ==========================
const login = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                facultyId: user.facultyId
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    register,
    login
};