const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    createRoom,
    getRooms,
    getRoom,
    deleteRoom
} = require("../controllers/roomController");

const router = express.Router();


// ==========================================
// CREATE ROOM
// FACULTY ONLY
// ==========================================

router.post(
    "/",
    protect,
    authorizeRoles("faculty"),
    createRoom
);


// ==========================================
// GET ALL ROOMS
// FACULTY ONLY
// ==========================================

router.get(
    "/",
    protect,
    authorizeRoles("faculty"),
    getRooms
);


// ==========================================
// GET SINGLE ROOM
// FACULTY ONLY
// ==========================================

router.get(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    getRoom
);


// ==========================================
// DELETE ROOM
// FACULTY ONLY
// ==========================================

router.delete(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    deleteRoom
);


module.exports = router;