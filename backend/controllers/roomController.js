const Room = require("../models/Room");


// ==========================================
// CREATE ROOM
// ==========================================

const createRoom = async (req, res) => {
    try {

        const {
            roomNumber,
            building,
            floor,
            rows,
            columns
        } = req.body;

        if (
            !roomNumber ||
            !rows ||
            !columns
        ) {
            return res.status(400).json({
                success: false,
                message: "Room number, rows and columns are required"
            });
        }

        const existingRoom = await Room.findOne({
            roomNumber
        });

        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: "Room already exists"
            });
        }

        const capacity =
            Number(rows) * Number(columns);

        const room = await Room.create({
            roomNumber,
            building: building || "",
            floor: floor || "",
            rows: Number(rows),
            columns: Number(columns),
            capacity
        });

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            room
        });

    } catch (error) {

        console.error(
            "Create room error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to create room",
            error: error.message
        });
    }
};


// ==========================================
// GET ALL ROOMS
// ==========================================

const getRooms = async (req, res) => {

    try {

        const rooms = await Room.find()
            .sort({
                roomNumber: 1
            });

        res.json({
            success: true,
            count: rooms.length,
            rooms
        });

    } catch (error) {

        console.error(
            "Get rooms error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });
    }
};


// ==========================================
// GET SINGLE ROOM
// ==========================================

const getRoom = async (req, res) => {

    try {

        const room =
            await Room.findById(
                req.params.id
            );

        if (!room) {

            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({
            success: true,
            room
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to fetch room"
        });
    }
};


// ==========================================
// DELETE ROOM
// ==========================================

const deleteRoom = async (req, res) => {

    try {

        const room =
            await Room.findByIdAndDelete(
                req.params.id
            );

        if (!room) {

            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        res.json({
            success: true,
            message: "Room deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: "Failed to delete room"
        });
    }
};


module.exports = {
    createRoom,
    getRooms,
    getRoom,
    deleteRoom
};