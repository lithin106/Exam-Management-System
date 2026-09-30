const Room = require("../models/Room");

const isPositiveInteger = (val) => {
    if (val === undefined || val === null || val === "") return false;
    const str = String(val).trim();
    if (!/^[1-9]\d*$/.test(str)) return false;
    const num = Number(str);
    return Number.isInteger(num) && num > 0;
};

const createRoom = async (req, res) => {
    try {
        const {
            roomNumber,
            building,
            floor,
            rows,
            columns,
            leftDeskBenches,
            middleDeskBenches,
            rightDeskBenches,
            studentsPerBench
        } = req.body;

        const room = String(roomNumber || "").trim();

        if (!room) {
            return res.status(400).json({
                success: false,
                message: "Room number is required"
            });
        }

        const existingRoom = await Room.findOne({
            roomNumber: room
        });

        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: "Room already exists"
            });
        }

        if (rows !== undefined && columns !== undefined) {
            if (!isPositiveInteger(rows) || !isPositiveInteger(columns)) {
                return res.status(400).json({
                    success: false,
                    message: "Number of desk rows and seats per row must be positive whole numbers"
                });
            }

            const r = Number(rows);
            const c = Number(columns);
            const usable = c >= 6 ? 6 : c >= 4 ? 4 : c >= 2 ? 2 : c;
            const capacity = r * usable;

            const newRoom = await Room.create({
                roomNumber: room,
                building: String(building || "").trim(),
                floor: String(floor || "").trim(),
                rows: r,
                columns: c,
                capacity,
                isAvailable: true
            });

            return res.status(201).json({
                success: true,
                message: "Room created successfully",
                room: newRoom
            });
        }

        const hasBenchConfig =
            leftDeskBenches !== undefined ||
            middleDeskBenches !== undefined ||
            rightDeskBenches !== undefined;

        if (hasBenchConfig) {
            if (
                !isPositiveInteger(leftDeskBenches) ||
                !isPositiveInteger(middleDeskBenches) ||
                !isPositiveInteger(rightDeskBenches)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Left, middle, and right desk benches must be positive whole numbers"
                });
            }

            const spb = studentsPerBench !== undefined ? studentsPerBench : 2;
            if (!isPositiveInteger(spb)) {
                return res.status(400).json({
                    success: false,
                    message: "Students per bench must be a positive whole number"
                });
            }

            const left = Number(leftDeskBenches);
            const middle = Number(middleDeskBenches);
            const right = Number(rightDeskBenches);
            const perBench = Number(spb);
            const capacity = (left + middle + right) * perBench;
            const maxRows = Math.max(left, middle, right);

            const newRoom = await Room.create({
                roomNumber: room,
                building: String(building || "").trim(),
                floor: String(floor || "").trim(),
                leftDeskBenches: left,
                middleDeskBenches: middle,
                rightDeskBenches: right,
                rows: maxRows,
                columns: 6,
                studentsPerBench: perBench,
                capacity,
                isAvailable: true
            });

            return res.status(201).json({
                success: true,
                message: "Room created successfully",
                room: newRoom
            });
        }

        return res.status(400).json({
            success: false,
            message: "Valid room dimensions are required"
        });
    } catch (error) {
        console.error("Create room error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create room",
            error: error.message
        });
    }
};

const getRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({
            roomNumber: 1
        });

        const updatedRooms = rooms.map(room => {
            const roomObject = room.toObject();

            if (
                room.leftDeskBenches !== undefined &&
                room.middleDeskBenches !== undefined &&
                room.rightDeskBenches !== undefined
            ) {
                const spb = Number(room.studentsPerBench) || 2;
                roomObject.capacity =
                    (Number(room.leftDeskBenches) +
                     Number(room.middleDeskBenches) +
                     Number(room.rightDeskBenches)) * spb;
            } else {
                const cols = Number(room.columns) || 0;
                const usable =
                    cols >= 6 ? 6
                        : cols >= 4 ? 4
                            : cols >= 2 ? 2
                                : cols;

                roomObject.capacity =
                    room.capacity || (Number(room.rows) * usable);
            }

            return roomObject;
        });

        res.json({
            success: true,
            count: updatedRooms.length,
            rooms: updatedRooms
        });
    } catch (error) {
        console.error("Get rooms error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });
    }
};

const getRoom = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const roomObject = room.toObject();

        if (
            room.leftDeskBenches !== undefined &&
            room.middleDeskBenches !== undefined &&
            room.rightDeskBenches !== undefined
        ) {
            roomObject.capacity =
                (Number(room.leftDeskBenches) +
                 Number(room.middleDeskBenches) +
                 Number(room.rightDeskBenches)) * (Number(room.studentsPerBench) || 2);
        } else {
            const cols = Number(room.columns) || 0;
            const usable =
                cols >= 6 ? 6
                    : cols >= 4 ? 4
                        : cols >= 2 ? 2
                            : cols;

            roomObject.capacity =
                room.capacity || (Number(room.rows) * usable);
        }

        res.json({
            success: true,
            room: roomObject
        });
    } catch (error) {
        console.error("Get room error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch room"
        });
    }
};

const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(
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
        console.error("Delete room error:", error);

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