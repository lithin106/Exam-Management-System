const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    getStudentProfile,
    getStudentExams,
    getStudentSeating
} = require("../controllers/studentPortalController");

const router = express.Router();

router.get(
    "/profile",
    protect,
    authorizeRoles("student"),
    getStudentProfile
);

router.get(
    "/exams",
    protect,
    authorizeRoles("student"),
    getStudentExams
);

router.get(
    "/seating",
    protect,
    authorizeRoles("student"),
    getStudentSeating
);

module.exports = router;
