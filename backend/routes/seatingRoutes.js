const express = require("express");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    generateSeating,
    getSeatingPlan,
    deleteSeatingPlan,
    downloadSeatingPDF,
    downloadNoticeBoardPDF,
    uploadOutputTemplate
} = require("../controllers/seatingController");

const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage
});

router.post(
    "/generate",
    protect,
    authorizeRoles("faculty"),
    generateSeating
);

router.get(
    "/:examId",
    protect,
    authorizeRoles("faculty"),
    getSeatingPlan
);

router.post(
    "/:examId/template",
    protect,
    authorizeRoles("faculty"),
    upload.single("template"),
    uploadOutputTemplate
);

router.get(
    "/:examId/pdf",
    protect,
    authorizeRoles("faculty"),
    downloadSeatingPDF
);

router.get(
    "/:examId/notice-board",
    protect,
    authorizeRoles("faculty"),
    downloadNoticeBoardPDF
);

router.delete(
    "/:examId",
    protect,
    authorizeRoles("faculty"),
    deleteSeatingPlan
);

module.exports = router;