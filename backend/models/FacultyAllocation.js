const mongoose = require("mongoose");

const facultyAllocationSchema = new mongoose.Schema(
    {
        exam: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
            unique: true
        },
        allocatedFaculty: [
            {
                faculty: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    default: null
                },
                facultyName: {
                    type: String,
                    required: true,
                    trim: true
                },
                employeeId: {
                    type: String,
                    default: "",
                    trim: true
                },
                department: {
                    type: String,
                    default: "",
                    trim: true
                },
                room: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Room",
                    required: true
                },
                roomNumber: {
                    type: String,
                    required: true,
                    trim: true
                }
            }
        ],
        status: {
            type: String,
            enum: ["allocated", "draft"],
            default: "allocated"
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FacultyAllocation", facultyAllocationSchema);
