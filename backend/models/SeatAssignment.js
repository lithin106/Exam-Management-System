const mongoose = require("mongoose");

const seatAssignmentSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true
        },

        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true
        },

        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true
        },

        seatNumber: {
            type: String,
            required: true
        },

        row: {
            type: Number,
            required: true
        },

        column: {
            type: Number,
            required: true
        },

        department: {
            type: String,
            required: true
        },

        studentId: {
            type: String,
            required: true
        },

        studentName: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
);


// Prevent duplicate student in same exam
seatAssignmentSchema.index(
    {
        exam: 1,
        student: 1
    },
    {
        unique: true
    }
);


// Prevent duplicate seat in same room/exam
seatAssignmentSchema.index(
    {
        exam: 1,
        room: 1,
        seatNumber: 1
    },
    {
        unique: true
    }
);


module.exports = mongoose.model(
    "SeatAssignment",
    seatAssignmentSchema
);