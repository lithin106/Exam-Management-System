const Exam = require("../models/Exam");
const Student = require("../models/Student");
const SeatAssignment = require("../models/SeatAssignment");

const {
    generateSeatingPlan
} = require("../utils/seatingAlgorithm");


// ======================================================
// GENERATE SEATING PLAN
// ======================================================

const generateSeating = async (
    req,
    res
) => {

    try {

        const {
            examId
        } = req.body;


        // ------------------------------------------------
        // VALIDATE EXAM ID
        // ------------------------------------------------

        if (!examId) {

            return res.status(400).json({

                success: false,

                message:
                    "Exam ID is required"

            });

        }


        // ------------------------------------------------
        // FIND EXAM
        // ------------------------------------------------

        const exam =
            await Exam.findById(
                examId
            ).populate("rooms");


        if (!exam) {

            return res.status(404).json({

                success: false,

                message:
                    "Exam not found"

            });

        }


        // ------------------------------------------------
        // VALIDATE ROOMS
        // ------------------------------------------------

        if (
            !exam.rooms ||
            exam.rooms.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No rooms assigned to this exam"

            });

        }


        // ------------------------------------------------
        // FIND ELIGIBLE STUDENTS
        // ------------------------------------------------

        const students =
            await Student.find({

                department: {
                    $in:
                        exam.departments
                },

                semester:
                    exam.semester,

                isEligible:
                    true

            })
            .sort({
                department: 1,
                studentId: 1
            });


        if (
            students.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "No eligible students found for this exam"

            });

        }


        // ------------------------------------------------
        // CALCULATE TOTAL CAPACITY
        // ------------------------------------------------

        const totalCapacity =
            exam.rooms.reduce(
                (
                    total,
                    room
                ) =>
                    total +
                    room.capacity,

                0
            );


        // ------------------------------------------------
        // CHECK CAPACITY
        // ------------------------------------------------

        if (
            students.length >
            totalCapacity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Insufficient capacity. Students: ${students.length}, Capacity: ${totalCapacity}`

            });

        }


        // ------------------------------------------------
        // DELETE PREVIOUS PLAN
        // ------------------------------------------------

        await SeatAssignment.deleteMany({

            exam:
                exam._id

        });


        // ------------------------------------------------
        // GENERATE NEW PLAN
        // ------------------------------------------------

        const result =
            generateSeatingPlan(

                students,

                exam.rooms

            );


        // ------------------------------------------------
        // CONVERT TO DATABASE DOCUMENTS
        // ------------------------------------------------

        const assignmentDocuments =
            result.assignments.map(
                assignment => ({

                    exam:
                        exam._id,

                    student:
                        assignment.student._id,

                    room:
                        assignment.room._id,

                    seatNumber:
                        assignment.seatNumber,

                    row:
                        assignment.row,

                    column:
                        assignment.column,

                    department:
                        assignment.department,

                    studentId:
                        assignment.student.studentId,

                    studentName:
                        assignment.student.name

                })
            );


        // ------------------------------------------------
        // SAVE
        // ------------------------------------------------

        if (
            assignmentDocuments.length > 0
        ) {

            await SeatAssignment.insertMany(
                assignmentDocuments
            );

        }


        // ------------------------------------------------
        // UPDATE EXAM STATUS
        // ------------------------------------------------

        exam.status =
            "scheduled";

        await exam.save();


        // ------------------------------------------------
        // RESPONSE
        // ------------------------------------------------

        res.status(201).json({

            success: true,

            message:
                "Seating plan generated successfully",

            statistics: {

                totalStudents:
                    result.totalStudents,

                assignedStudents:
                    result.assignedStudents,

                unassignedStudents:
                    result.unassignedCount,

                totalSeats:
                    result.totalSeats,

                availableSeats:
                    result.totalSeats -
                    result.assignedStudents,

                usedRooms:
                    result.usedRooms,

                totalRooms:
                    result.totalRooms

            },

            assignments:
                assignmentDocuments,

            unassigned:
                result.unassignedStudents.map(
                    student => ({

                        studentId:
                            student.studentId,

                        name:
                            student.name,

                        department:
                            student.department

                    })
                )

        });

    }

    catch (error) {

        console.error(
            "Generate seating error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to generate seating plan",

            error:
                error.message

        });

    }

};


// ======================================================
// GET SEATING PLAN
// ======================================================

const getSeatingPlan = async (
    req,
    res
) => {

    try {

        const {
            examId
        } = req.params;


        const assignments =
            await SeatAssignment.find({

                exam:
                    examId

            })
            .populate(
                "student",
                "studentId name department email"
            )
            .populate(
                "room",
                "roomNumber building floor rows columns capacity"
            )
            .sort({

                room: 1,

                row: 1,

                column: 1

            });


        res.json({

            success: true,

            count:
                assignments.length,

            assignments

        });

    }

    catch (error) {

        console.error(
            "Get seating error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch seating plan",

            error:
                error.message

        });

    }

};


// ======================================================
// DELETE SEATING PLAN
// ======================================================

const deleteSeatingPlan = async (
    req,
    res
) => {

    try {

        const {
            examId
        } = req.params;


        const result =
            await SeatAssignment.deleteMany({

                exam:
                    examId

            });


        res.json({

            success: true,

            message:
                "Seating plan deleted successfully",

            deletedCount:
                result.deletedCount

        });

    }

    catch (error) {

        console.error(
            "Delete seating error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete seating plan",

            error:
                error.message

        });

    }

};

// ======================================================
// DOWNLOAD SEATING PLAN PDF
// ======================================================

const downloadSeatingPDF = async (
    req,
    res
) => {

    try {

        const {
            examId
        } = req.params;


        // ------------------------------------------------
        // FIND EXAM
        // ------------------------------------------------

        const exam =
            await Exam.findById(
                examId
            );


        if (!exam) {

            return res.status(404).json({

                success: false,

                message:
                    "Exam not found"

            });

        }


        // ------------------------------------------------
        // GET SEATING ASSIGNMENTS
        // ------------------------------------------------

        const assignments =
            await SeatAssignment.find({

                exam:
                    examId

            })
            .populate(
                "student",
                "studentId name department"
            )
            .populate(
                "room",
                "roomNumber building floor rows columns capacity"
            )
            .sort({

                room: 1,

                row: 1,

                column: 1

            });


        if (
            assignments.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "No seating plan exists for this examination"

            });

        }


        // ------------------------------------------------
        // GENERATE PDF
        // ------------------------------------------------

        const {
            generateSeatingPDF
        } =
            require(
                "../utils/pdfGenerator"
            );


        generateSeatingPDF(
            exam,
            assignments,
            res
        );

    }

    catch (error) {

        console.error(
            "PDF generation error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to generate seating plan PDF",

            error:
                error.message

        });

    }

};
module.exports = {

    generateSeating,

    getSeatingPlan,

    deleteSeatingPlan

};
module.exports = {

    generateSeating,

    getSeatingPlan,

    deleteSeatingPlan,

    downloadSeatingPDF

};