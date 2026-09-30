const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
    {
        studentId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        name: {
            type: String,
            required: true,
            trim: true
        },

        department: {
            type: String,
            default: "CSE",
            trim: true,
            uppercase: true
        },

        section: {
            type: String,
            default: "",
            trim: true,
            uppercase: true
        },

        semester: {
            type: String,
            default: "7",
            trim: true
        },

        labBatch: {
            type: String,
            default: "",
            trim: true
        },

        isEligible: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Student",
        studentSchema
    );