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
            default: ""
        },

        floor: {
            type: String,
            default: ""
        },

        rows: {
            type: Number,
            required: true,
            min: 1
        },

        columns: {
            type: Number,
            required: true,
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