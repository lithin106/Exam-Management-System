const express = require("express");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    createExam,
    getExams,
    getExam,
    deleteExam
} = require("../controllers/examController");

const router = express.Router();


// Create exam
router.post(
    "/",
    protect,
    authorizeRoles("faculty"),
    createExam
);


// Get all exams
router.get(
    "/",
    protect,
    authorizeRoles("faculty"),
    getExams
);


// Get single exam
router.get(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    getExam
);


// Delete exam
router.delete(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    deleteExam
);


module.exports = router;