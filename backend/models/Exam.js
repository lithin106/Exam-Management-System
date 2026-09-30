const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
    {
        examName: {
            type: String,
            required: true,
            trim: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        examDate: {
            type: Date,
            required: true
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },

        semester: {
            type: String,
            required: true
        },

        departments: {
            type: [String],
            required: true
        },

        rooms: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Room"
            }
        ],

        // ==================================================
        // SEATING CONFIGURATION
        // ==================================================

        studentsPerBench: {
            type: Number,
            default: 2,
            min: 1
        },

        commonPaperGroups: {
            type: String,
            default: "",
            trim: true
        },

        // ==================================================
        // OUTPUT TEMPLATE
        // ==================================================
        //
        // Stores the path of the uploaded college
        // seating-plan header/template image.
        //

        outputTemplate: {
            type: String,
            default: ""
        },

        roomConfigurations: [
            {
                room: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Room"
                },
                defectiveDesks: [
                    {
                        row: {
                            type: Number,
                            required: true
                        },
                        desk: {
                            type: String,
                            enum: [
                                "left",
                                "middle",
                                "right"
                            ],
                            required: true
                        }
                    }
                ]
            }
        ],

        status: {
            type: String,
            enum: [
                "draft",
                "scheduled",
                "completed"
            ],
            default: "draft"
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

module.exports =
    mongoose.model(
        "Exam",
        examSchema
    );