const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    generateSeating,
    getSeatingPlan,
    deleteSeatingPlan,
    downloadSeatingPDF
} = require("../controllers/seatingController");


const router =
    express.Router();


// ======================================================
// GENERATE SEATING
// ======================================================

router.post(
    "/generate",
    protect,
    authorizeRoles("faculty"),
    generateSeating
);


// ======================================================
// GET SEATING PLAN
// ======================================================

router.get(
    "/:examId",
    protect,
    authorizeRoles("faculty"),
    getSeatingPlan
);


// ======================================================
// DOWNLOAD SEATING PDF
// ======================================================

router.get(
    "/:examId/pdf",
    protect,
    authorizeRoles("faculty"),
    downloadSeatingPDF
);


// ======================================================
// DELETE SEATING PLAN
// ======================================================

router.delete(
    "/:examId",
    protect,
    authorizeRoles("faculty"),
    deleteSeatingPlan
);


module.exports = router;