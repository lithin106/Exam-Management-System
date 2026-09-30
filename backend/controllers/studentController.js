const Student =
    require("../models/Student");

const parseStudentExcel =
    require("../utils/excelParser");

const fs =
    require("fs");


// ==========================================
// UPLOAD STUDENTS FROM EXCEL
// ==========================================

const uploadStudents = async (
    req,
    res
) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Please upload an Excel file"

            });

        }


        const students =
            parseStudentExcel(
                req.file.path
            );


        if (
            !students.length
        ) {

            fs.unlinkSync(
                req.file.path
            );

            return res.status(400).json({

                success: false,

                message:
                    "Excel file contains no valid student records"

            });

        }


        let insertedStudents = 0;

        let skippedStudents = 0;


        // ==========================================
        // INSERT STUDENTS
        // ==========================================

        for (
            const student
            of students
        ) {

            // Minimum required data:
            //
            // USN
            // Name

            if (
                !student.studentId ||
                !student.name
            ) {

                skippedStudents++;

                continue;

            }


            // ======================================
            // CHECK DUPLICATE USN
            // ======================================

            const existingStudent =
                await Student.findOne({

                    studentId:
                        student.studentId

                });


            if (
                existingStudent
            ) {

                skippedStudents++;

                continue;

            }


            // ======================================
            // CREATE STUDENT
            // ======================================

            await Student.create({

                studentId:
                    student.studentId,

                name:
                    student.name,

                department:
                    student.department,

                section:
                    student.section,

                semester:
                    student.semester,

                labBatch:
                    student.labBatch,

                isEligible:
                    true

            });


            insertedStudents++;

        }


        // ==========================================
        // DELETE TEMPORARY FILE
        // ==========================================

        try {

            fs.unlinkSync(
                req.file.path
            );

        } catch (cleanupError) {

            console.log(
                "Uploaded file cleanup warning:",
                cleanupError.message
            );

        }


        // ==========================================
        // RESPONSE
        // ==========================================

        return res.status(201).json({

            success: true,

            message:
                "Student Excel processed successfully",

            insertedStudents,

            skippedStudents,

            totalRecords:
                students.length

        });


    } catch (error) {

        console.error(
            "Excel upload error:",
            error
        );


        if (req.file) {

            try {

                fs.unlinkSync(
                    req.file.path
                );

            } catch (cleanupError) {

                console.log(
                    "File cleanup failed"
                );

            }

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to process student file",

            error:
                error.message

        });

    }

};


// ==========================================
// GET ALL STUDENTS
// ==========================================

const getStudents = async (
    req,
    res
) => {

    try {

        const students =
            await Student.find()
                .sort({

                    studentId: 1

                });


        return res.json({

            success: true,

            count:
                students.length,

            students

        });


    } catch (error) {

        console.error(
            "Get students error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch students"

        });

    }

};


const deleteAllStudents = async (
    req,
    res
) => {

    try {

        const SeatAssignment =
            require("../models/SeatAssignment");

        const assignmentResult =
            await SeatAssignment.deleteMany({});

        const studentResult =
            await Student.deleteMany({});

        return res.json({

            success: true,

            message:
                `Deleted ${studentResult.deletedCount} students and ${assignmentResult.deletedCount} seat assignments.`,

            deletedStudents:
                studentResult.deletedCount,

            deletedAssignments:
                assignmentResult.deletedCount

        });

    } catch (error) {

        console.error(
            "Delete all students error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to delete students"

        });

    }

};


module.exports = {

    uploadStudents,

    getStudents,

    deleteAllStudents

};