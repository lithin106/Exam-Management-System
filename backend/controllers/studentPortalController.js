const Student = require("../models/Student");
const SeatAssignment = require("../models/SeatAssignment");
const Exam = require("../models/Exam");

const getStudentProfile = async (req, res) => {
    try {
        const studentId = req.user.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "No student ID linked to this account."
            });
        }

        const student = await Student.findOne({ studentId });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student record not found. Please contact your department coordinator."
            });
        }

        res.json({
            success: true,
            student: {
                name: student.name,
                studentId: student.studentId,
                department: student.department,
                semester: student.semester,
                section: student.section,
                labBatch: student.labBatch,
                isEligible: student.isEligible
            }
        });

    } catch (error) {
        console.error("Student profile error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student profile"
        });
    }
};

const getStudentExams = async (req, res) => {
    try {
        const studentId = req.user.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "No student ID linked to this account."
            });
        }

        const assignments = await SeatAssignment.find({ studentId })
            .populate({
                path: "exam",
                select: "examName subject examDate startTime endTime status semester departments"
            })
            .sort({ createdAt: -1 });

        const examMap = new Map();

        assignments.forEach(assignment => {
            if (assignment.exam) {
                const examId = assignment.exam._id.toString();
                if (!examMap.has(examId)) {
                    examMap.set(examId, {
                        _id: assignment.exam._id,
                        examName: assignment.exam.examName,
                        subject: assignment.exam.subject,
                        examDate: assignment.exam.examDate,
                        startTime: assignment.exam.startTime,
                        endTime: assignment.exam.endTime,
                        status: assignment.exam.status,
                        semester: assignment.exam.semester,
                        departments: assignment.exam.departments
                    });
                }
            }
        });

        const exams = Array.from(examMap.values()).sort((a, b) => {
            return new Date(b.examDate) - new Date(a.examDate);
        });

        res.json({
            success: true,
            count: exams.length,
            exams
        });

    } catch (error) {
        console.error("Student exams error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch exam information"
        });
    }
};

const getStudentSeating = async (req, res) => {
    try {
        const studentId = req.user.studentId;

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "No student ID linked to this account."
            });
        }

        const assignments = await SeatAssignment.find({ studentId })
            .populate({
                path: "exam",
                select: "examName subject examDate startTime endTime status semester"
            })
            .populate({
                path: "room",
                select: "roomNumber building floor rows columns capacity"
            })
            .sort({ createdAt: -1 });

        const seating = assignments
            .filter(a => a.exam && a.room)
            .map(assignment => ({
                examName: assignment.exam.examName,
                subject: assignment.exam.subject,
                examDate: assignment.exam.examDate,
                startTime: assignment.exam.startTime,
                endTime: assignment.exam.endTime,
                examStatus: assignment.exam.status,
                semester: assignment.exam.semester,
                roomNumber: assignment.room.roomNumber,
                building: assignment.room.building,
                floor: assignment.room.floor,
                seatNumber: assignment.seatNumber,
                row: assignment.row,
                column: assignment.column,
                department: assignment.department
            }));

        res.json({
            success: true,
            count: seating.length,
            seating
        });

    } catch (error) {
        console.error("Student seating error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch seating information"
        });
    }
};

module.exports = {
    getStudentProfile,
    getStudentExams,
    getStudentSeating
};
