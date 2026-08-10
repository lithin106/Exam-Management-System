const Exam = require("../models/Exam");
const Room = require("../models/Room");


// ======================================================
// CREATE EXAM
// ======================================================

const createExam = async (
    req,
    res
) => {

    try {

        const {
            examName,
            subject,
            examDate,
            startTime,
            endTime,
            semester,
            departments,
            rooms
        } = req.body;


        // ------------------------------------------------
        // VALIDATION
        // ------------------------------------------------

        if (
            !examName ||
            !subject ||
            !examDate ||
            !startTime ||
            !endTime ||
            !semester
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All exam details are required"

            });

        }


        if (
            !Array.isArray(
                departments
            ) ||
            departments.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one department must be selected"

            });

        }


        if (
            !Array.isArray(rooms) ||
            rooms.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "At least one room must be selected"

            });

        }


        // ------------------------------------------------
        // VALIDATE ROOMS
        // ------------------------------------------------

        const selectedRooms =
            await Room.find({

                _id: {
                    $in: rooms
                },

                isAvailable:
                    true

            });


        if (
            selectedRooms.length !==
            rooms.length
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "One or more rooms are invalid or unavailable"

            });

        }


        // ------------------------------------------------
        // CREATE EXAM
        // ------------------------------------------------

        const exam =
            await Exam.create({

                examName:
                    examName.trim(),

                subject:
                    subject.trim(),

                examDate:
                    new Date(examDate),

                startTime,

                endTime,

                semester:
                    String(semester),

                departments,

                rooms,

                status:
                    "draft",

                createdBy:
                    req.user._id

            });


        // ------------------------------------------------
        // RETURN POPULATED EXAM
        // ------------------------------------------------

        const savedExam =
            await Exam.findById(
                exam._id
            )
            .populate("rooms")
            .populate(
                "createdBy",
                "name email"
            );


        res.status(201).json({

            success: true,

            message:
                "Exam created successfully",

            exam:
                savedExam

        });

    }

    catch (error) {

        console.error(
            "Create exam error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to create exam",

            error:
                error.message

        });

    }

};


// ======================================================
// GET ALL EXAMS
// ======================================================

const getExams = async (
    req,
    res
) => {

    try {

        const exams =
            await Exam.find({})
                .populate(
                    "rooms"
                )
                .populate(
                    "createdBy",
                    "name email"
                )
                .sort({

                    examDate: 1,

                    startTime: 1,

                    createdAt: -1

                });


        res.status(200).json({

            success: true,

            count:
                exams.length,

            exams

        });

    }

    catch (error) {

        console.error(
            "Get exams error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch exams",

            error:
                error.message

        });

    }

};


// ======================================================
// GET SINGLE EXAM
// ======================================================

const getExam = async (
    req,
    res
) => {

    try {

        const exam =
            await Exam.findById(
                req.params.id
            )
            .populate("rooms")
            .populate(
                "createdBy",
                "name email"
            );


        if (!exam) {

            return res.status(404).json({

                success: false,

                message:
                    "Exam not found"

            });

        }


        res.status(200).json({

            success: true,

            exam

        });

    }

    catch (error) {

        console.error(
            "Get exam error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch exam",

            error:
                error.message

        });

    }

};


// ======================================================
// DELETE EXAM
// ======================================================

const deleteExam = async (
    req,
    res
) => {

    try {

        const exam =
            await Exam.findByIdAndDelete(
                req.params.id
            );


        if (!exam) {

            return res.status(404).json({

                success: false,

                message:
                    "Exam not found"

            });

        }


        res.status(200).json({

            success: true,

            message:
                "Exam deleted successfully"

        });

    }

    catch (error) {

        console.error(
            "Delete exam error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete exam",

            error:
                error.message

        });

    }

};


module.exports = {

    createExam,

    getExams,

    getExam,

    deleteExam

};