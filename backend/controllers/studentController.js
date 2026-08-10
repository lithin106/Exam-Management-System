const Student = require("../models/Student");
const User = require("../models/User");
const parseStudentExcel = require("../utils/excelParser");
const bcrypt = require("bcryptjs");
const fs = require("fs");


// ==========================================
// UPLOAD STUDENTS FROM EXCEL
// ==========================================

const uploadStudents = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an Excel file"
            });
        }

        const students = parseStudentExcel(
            req.file.path
        );

        if (!students.length) {

            fs.unlinkSync(req.file.path);

            return res.status(400).json({
                success: false,
                message: "Excel file contains no student data"
            });
        }

        let insertedStudents = 0;
        let skippedStudents = 0;

        for (const student of students) {

            // Basic validation
            if (
                !student.studentId ||
                !student.name ||
                !student.email ||
                !student.department ||
                !student.year
            ) {

                skippedStudents++;

                continue;
            }

            // Check if student already exists
            const existingStudent =
                await Student.findOne({
                    $or: [
                        { studentId: student.studentId },
                        { email: student.email }
                    ]
                });

            if (existingStudent) {
                skippedStudents++;
                continue;
            }

            // Create student
            await Student.create(student);

            // Create login account
            const defaultPassword =
                student.studentId;

            const hashedPassword =
                await bcrypt.hash(
                    defaultPassword,
                    10
                );

            const existingUser =
                await User.findOne({
                    email: student.email
                });

            if (!existingUser) {

                await User.create({

                    name: student.name,

                    email: student.email,

                    password: hashedPassword,

                    role: "student",

                    studentId: student.studentId

                });
            }

            insertedStudents++;
        }

        // Remove uploaded Excel file
        fs.unlinkSync(req.file.path);

        res.status(201).json({

            success: true,

            message: "Student Excel processed successfully",

            insertedStudents,

            skippedStudents,

            totalRecords: students.length
        });

    } catch (error) {

        console.error(
            "Excel upload error:",
            error
        );

        if (req.file) {

            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error(
                    "File cleanup failed"
                );
            }
        }

        res.status(500).json({

            success: false,

            message: "Failed to process Excel file",

            error: error.message
        });
    }
};


// ==========================================
// GET ALL STUDENTS
// ==========================================

const getStudents = async (req, res) => {

    try {

        const students =
            await Student.find()
                .sort({
                    department: 1,
                    studentId: 1
                });

        res.json({

            success: true,

            count: students.length,

            students

        });

    } catch (error) {

        res.status(500).json({

            success: false,

            message: "Failed to fetch students"
        });
    }
};


module.exports = {
    uploadStudents,
    getStudents
};