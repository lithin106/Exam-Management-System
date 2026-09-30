const Exam = require("../models/Exam");
const Room = require("../models/Room");
const SeatAssignment = require("../models/SeatAssignment");

// ======================================================
// CREATE EXAM
// ======================================================

const createExam = async (req, res) => {

    try {

        const {
            examName,
            subject,
            examDate,
            startTime,
            endTime,
            semester,
            departments,
            rooms,
            studentsPerBench,
            commonPaperGroups,
            roomConfigurations
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
                message: "All exam details are required"
            });

        }

        // Validate that exam date is not in the past
        const parsedExamDate = new Date(examDate);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const examDay = new Date(parsedExamDate);
        examDay.setHours(0, 0, 0, 0);

        if (examDay < todayStart) {
            return res.status(400).json({
                success: false,
                message: "Cannot schedule an examination in the past. Please select today or a future date."
            });
        }


        const examDepartments =
            Array.isArray(departments) &&
            departments.length > 0
                ? departments
                : ["CSE"];


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
        // BENCH CONFIGURATION
        // ------------------------------------------------

        const benchSize =
            Number(studentsPerBench) || 2;


        if (
            benchSize < 1 ||
            benchSize > 6
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Students per bench must be between 1 and 6"
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
                isAvailable: true
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
                    parsedExamDate,

                startTime,

                endTime,

                semester:
                    String(semester),

                departments:
                    examDepartments,

                rooms,

                studentsPerBench:
                    benchSize,

                commonPaperGroups:
                    commonPaperGroups
                        ? String(commonPaperGroups).trim()
                        : "",

                roomConfigurations:
                    Array.isArray(roomConfigurations)
                        ? roomConfigurations
                        : [],

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
// GET ALL ACTIVE EXAMS (Auto-cleans expired exams)
// ======================================================

const getExams = async (req, res) => {

    try {

        // Auto clean up expired exams whose examDate has passed (prior to today)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const expiredExams = await Exam.find({
            examDate: { $lt: todayStart }
        });

        if (expiredExams.length > 0) {
            const expiredIds = expiredExams.map(e => e._id);
            await SeatAssignment.deleteMany({ exam: { $in: expiredIds } });
            await Exam.deleteMany({ _id: { $in: expiredIds } });
        }

        // Return only active & upcoming exams
        const exams =
            await Exam.find({
                examDate: { $gte: todayStart }
            })
                .populate("rooms")
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

const getExam = async (req, res) => {

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

const deleteExam = async (req, res) => {

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

        // Also clean up any seat assignments associated with this deleted exam
        await SeatAssignment.deleteMany({
            exam: req.params.id
        });


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