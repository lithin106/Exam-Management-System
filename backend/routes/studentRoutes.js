const express = require("express");
const multer = require("multer");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    uploadStudents,
    getStudents
} = require("../controllers/studentController");

const router = express.Router();


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/");
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            file.originalname;

        cb(null, uniqueName);
    }

});


const upload = multer({
    storage: storage,

    fileFilter: (req, file, cb) => {

        const allowedExtensions =
            [".xlsx", ".xls"];

        const extension =
            file.originalname
                .toLowerCase()
                .slice(
                    file.originalname
                        .lastIndexOf(".")
                );

        if (
            allowedExtensions
                .includes(extension)
        ) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only Excel files are allowed"
                )
            );
        }
    }
});


// ==========================================
// FACULTY: UPLOAD EXCEL
// ==========================================

router.post(
    "/upload",
    protect,
    authorizeRoles("faculty"),
    upload.single("file"),
    uploadStudents
);


// ==========================================
// FACULTY: GET STUDENTS
// ==========================================

router.get(
    "/",
    protect,
    authorizeRoles("faculty"),
    getStudents
);


module.exports = router;