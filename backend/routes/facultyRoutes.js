const express = require("express");
const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const {
    getFacultyList,
    addFaculty,
    deleteFaculty,
    getAllocations,
    getExamAllocation,
    saveAllocation,
    deleteAllocation
} = require("../controllers/facultyController");

const router = express.Router();

router.get(
    "/dashboard",
    protect,
    authorizeRoles("faculty"),
    (req, res) => {
        res.json({
            success: true,
            message: "Welcome to Faculty Dashboard",
            user: req.user
        });
    }
);

router.get(
    "/list",
    protect,
    authorizeRoles("faculty"),
    getFacultyList
);

router.post(
    "/add",
    protect,
    authorizeRoles("faculty"),
    addFaculty
);

router.delete(
    "/:id",
    protect,
    authorizeRoles("faculty"),
    deleteFaculty
);

router.get(
    "/allocations",
    protect,
    authorizeRoles("faculty"),
    getAllocations
);

router.get(
    "/allocation/:examId",
    protect,
    authorizeRoles("faculty"),
    getExamAllocation
);

router.post(
    "/allocation",
    protect,
    authorizeRoles("faculty"),
    saveAllocation
);

router.delete(
    "/allocation/:examId",
    protect,
    authorizeRoles("faculty"),
    deleteAllocation
);

module.exports = router;