const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        building: {
            type: String,
            default: "",
            trim: true
        },

        floor: {
            type: String,
            default: "",
            trim: true
        },

        leftDeskBenches: {
            type: Number,
            min: 1
        },

        middleDeskBenches: {
            type: Number,
            min: 1
        },

        rightDeskBenches: {
            type: Number,
            min: 1
        },

        rows: {
            type: Number,
            min: 1
        },

        columns: {
            type: Number,
            default: 6
        },

        studentsPerBench: {
            type: Number,
            default: 2,
            min: 1
        },

        capacity: {
            type: Number,
            required: true,
            min: 1
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Room", roomSchema);