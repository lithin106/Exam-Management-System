const Exam = require("../models/Exam");
const Student = require("../models/Student");
const SeatAssignment = require("../models/SeatAssignment");

const {
    generateNoticeBoardPDF
} = require("../utils/noticeBoard");

const {
    generateSeatingPlan
} = require("../utils/seatingAlgorithm");

const orderAssignments = (
    assignments,
    examRooms
) => {
    const roomOrder = new Map();

    examRooms.forEach(
        (room, index) => {
            const id =
                room._id
                    ? room._id.toString()
                    : String(
                        room.roomNumber
                    );

            roomOrder.set(
                id,
                index
            );
        }
    );

    return [...assignments].sort(
        (a, b) => {
            const aRoomId =
                a.room?._id
                    ? a.room._id.toString()
                    : String(a.room);

            const bRoomId =
                b.room?._id
                    ? b.room._id.toString()
                    : String(b.room);

            const roomComparison =
                (
                    roomOrder.get(aRoomId) ?? 999999
                ) -
                (
                    roomOrder.get(bRoomId) ?? 999999
                );

            if (roomComparison !== 0) {
                return roomComparison;
            }

            if (a.row !== b.row) {
                return a.row - b.row;
            }

            return a.column - b.column;
        }
    );
};

const generateSeating = async (
    req,
    res
) => {
    try {
        const { examId } = req.body;

        if (!examId) {
            return res.status(400).json({
                success: false,
                message: "Exam ID is required"
            });
        }

        const exam =
            await Exam.findById(
                examId
            ).populate("rooms");

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const examDay = new Date(exam.examDate);
        examDay.setHours(0, 0, 0, 0);

        if (examDay < todayStart) {
            return res.status(400).json({
                success: false,
                message: "This examination date has already passed. Cannot generate seating for expired exams."
            });
        }

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

        const students =
            await Student.find({
                isEligible: true
            }).sort({
                studentId: 1
            });

        students.sort((a, b) => {
            const aId = a.studentId || "";
            const bId = b.studentId || "";
            const aMatch = aId.match(/(\d+)$/);
            const bMatch = bId.match(/(\d+)$/);
            const aRoll = aMatch
                ? parseInt(aMatch[1], 10) : 0;
            const bRoll = bMatch
                ? parseInt(bMatch[1], 10) : 0;

            if (aRoll !== bRoll) {
                return aRoll - bRoll;
            }

            return aId.localeCompare(bId);
        });

        if (students.length === 0) {
            return res.status(400).json({
                success: false,
                message:
                    "No eligible students found"
            });
        }

        const roomConfigurations = exam.roomConfigurations || [];

        const DESK_COLS = { left: [1, 3], middle: [4, 6], right: [7, 9] };

        const totalCapacity =
            exam.rooms.reduce(
                (total, room) => {
                    const rows =
                        Number(room.rows) || 0;

                    const columns =
                        Number(room.columns) || 0;

                    let usable;
                    if (columns >= 2) {
                        usable =
                            columns >= 6
                                ? 6
                                : columns >= 4
                                    ? 4
                                    : 2;
                    } else {
                        usable = columns;
                    }

                    let roomTotal = rows * usable;

                    const roomId = room._id ? room._id.toString() : String(room.roomNumber);
                    const config = roomConfigurations.find(c => {
                        const cId = c.room?._id ? c.room._id.toString() : c.room ? String(c.room) : "";
                        return cId === roomId;
                    });

                    if (config && Array.isArray(config.defectiveDesks) && config.defectiveDesks.length > 0) {
                        const blocked = new Set();
                        config.defectiveDesks.forEach(({ row, desk }) => {
                            const cols = DESK_COLS[desk];
                            if (cols) cols.forEach(c => blocked.add(`${row}-${c}`));
                        });

                        const usableColumns = [];
                        if (columns >= 2) { usableColumns.push(1); usableColumns.push(3); }
                        if (columns >= 4) { usableColumns.push(4); usableColumns.push(6); }
                        if (columns >= 6) { usableColumns.push(7); usableColumns.push(9); }

                        let blockedCount = 0;
                        for (const col of usableColumns) {
                            for (let r = 1; r <= rows; r++) {
                                if (blocked.has(`${r}-${col}`)) blockedCount++;
                            }
                        }
                        roomTotal -= blockedCount;
                    }

                    return total + roomTotal;
                },
                0
            );

        if (
            students.length >
            totalCapacity
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Insufficient usable seating capacity. Students: ${students.length}, Capacity: ${totalCapacity}`
            });
        }

        await SeatAssignment.deleteMany({
            exam: exam._id
        });

        const sortedRooms =
            [...exam.rooms].sort(
                (a, b) =>
                    (a.roomNumber || "")
                        .localeCompare(
                            b.roomNumber || ""
                        )
            );

        const result =
            generateSeatingPlan(
                students,
                sortedRooms,
                roomConfigurations
            );

        if (
            result.assignedStudents !==
            result.totalStudents
        ) {
            return res.status(400).json({
                success: false,
                message:
                    `Not all students could be assigned. Assigned: ${result.assignedStudents}, Total: ${result.totalStudents}, Unassigned: ${result.unassignedCount}`,
                statistics: {
                    totalStudents:
                        result.totalStudents,
                    assignedStudents:
                        result.assignedStudents,
                    unassignedStudents:
                        result.unassignedCount,
                    totalSeats:
                        result.totalSeats
                },
                unassigned:
                    result.unassignedStudents.map(
                        student => ({
                            studentId:
                                student.studentId,
                            name:
                                student.name,
                            department:
                                student.department || ""
                        })
                    )
            });
        }

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

        if (
            assignmentDocuments.length > 0
        ) {
            await SeatAssignment.insertMany(
                assignmentDocuments
            );
        }

        exam.status = "scheduled";

        await exam.save();

        res.status(201).json({
            success: true,
            message:
                "Seating plan generated successfully",
            configuration: {
                studentsPerBench: 2,
                commonPaperGroups: "",
                totalBenches:
                    result.totalBenches
            },
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
            unassigned: []
        });

    } catch (error) {
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

const getSeatingPlan = async (
    req,
    res
) => {
    try {
        const {
            examId
        } = req.params;

        const exam =
            await Exam.findById(
                examId
            ).populate("rooms");

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Exam not found"
            });
        }

        const assignments =
            await SeatAssignment.find({
                exam: examId
            })
                .populate(
                    "student",
                    "studentId name department"
                )
                .populate(
                    "room",
                    "roomNumber building floor rows columns capacity"
                );

        const orderedAssignments =
            orderAssignments(
                assignments,
                exam.rooms
            );

        res.json({
            success: true,
            count:
                orderedAssignments.length,
            assignments:
                orderedAssignments
        });

    } catch (error) {
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
                exam: examId
            });

        res.json({
            success: true,
            message:
                "Seating plan deleted successfully",
            deletedCount:
                result.deletedCount
        });

    } catch (error) {
        console.error(
            "Delete seating error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete seating plan"
        });
    }
};

const uploadOutputTemplate = async (
    req,
    res
) => {
    try {
        const {
            examId
        } = req.params;

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

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Please upload a template image"
            });
        }

        exam.outputTemplate =
            req.file.path;

        await exam.save();

        res.json({
            success: true,
            message:
                "Output template uploaded successfully",
            template:
                req.file.path
        });

    } catch (error) {
        console.error(
            "Upload template error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to upload output template",
            error:
                error.message
        });
    }
};

const downloadSeatingPDF = async (
    req,
    res
) => {
    try {
        const {
            examId
        } = req.params;

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

        const assignments =
            await SeatAssignment.find({
                exam: examId
            })
                .populate(
                    "student",
                    "studentId name department paper"
                )
                .populate(
                    "room",
                    "roomNumber building floor rows columns capacity"
                );

        const orderedAssignments =
            orderAssignments(
                assignments,
                exam.rooms
            );

        if (
            orderedAssignments.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "No seating plan exists for this examination"
            });
        }

        const {
            generateSeatingPDF
        } =
            require(
                "../utils/pdfGenerator"
            );

        generateSeatingPDF(
            exam,
            orderedAssignments,
            res,
            exam.roomConfigurations || []
        );

    } catch (error) {
        console.error(
            "PDF generation error:",
            error
        );

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message:
                    "Failed to generate seating plan PDF",
                error:
                    error.message
            });
        }
    }
};

const downloadNoticeBoardPDF =
    async (
        req,
        res
    ) => {
        try {
            const {
                examId
            } = req.params;

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

            const assignments =
                await SeatAssignment.find({
                    exam: examId
                })
                    .populate(
                        "student",
                        "studentId name department"
                    )
                    .populate(
                        "room",
                        "roomNumber"
                    );

            const orderedAssignments =
                orderAssignments(
                    assignments,
                    exam.rooms
                );

            if (
                orderedAssignments.length === 0
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "No seating plan exists for this examination"
                });
            }

            const pdf =
                await generateNoticeBoardPDF(
                    orderedAssignments,
                    exam
                );

            res.setHeader(
                "Content-Type",
                "application/pdf"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="room-allotment-${examId}.pdf"`
            );

            res.send(pdf);

        } catch (error) {
            console.error(
                "Notice board PDF error:",
                error
            );

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message:
                        "Failed to generate notice board PDF",
                    error:
                        error.message
                });
            }
        }
    };

module.exports = {
    generateSeating,
    getSeatingPlan,
    deleteSeatingPlan,
    downloadSeatingPDF,
    downloadNoticeBoardPDF,
    uploadOutputTemplate
};