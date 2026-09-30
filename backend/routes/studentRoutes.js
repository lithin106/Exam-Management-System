const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const protect =
    require("../middleware/authMiddleware");

const authorizeRoles =
    require("../middleware/roleMiddleware");

const {
    uploadStudents,
    getStudents,
    deleteAllStudents
} =
    require("../controllers/studentController");

const router =
    express.Router();


// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDirectory =
    path.join(
        __dirname,
        "..",
        "uploads"
    );


if (
    !fs.existsSync(
        uploadDirectory
    )
) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


// ==========================================
// MULTER STORAGE
// ==========================================

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    uploadDirectory
                );

            },


        filename:
            function (
                req,
                file,
                cb
            ) {

                const uniqueName =
                    Date.now() +
                    "-" +
                    file.originalname
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            "_"
                        );


                cb(
                    null,
                    uniqueName
                );

            }

    });


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload =
    multer({

        storage:

            storage,


        limits: {

            // Maximum 10 MB
            fileSize:
                10 * 1024 * 1024

        },


        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const allowedExtensions = [

                    ".xlsx",

                    ".xls",

                    ".pdf"

                ];


                const extension =
                    path.extname(
                        file.originalname
                    )
                        .toLowerCase();


                if (
                    allowedExtensions
                        .includes(
                            extension
                        )
                ) {

                    cb(
                        null,
                        true
                    );

                }

                else {

                    cb(
                        new Error(
                            "Only XLSX, XLS or PDF files are allowed"
                        )
                    );

                }

            }

    });


// ==========================================
// FACULTY: UPLOAD STUDENT FILE
// ==========================================
//
// Supported:
//
// .xlsx
// .xls
// .pdf
//
// Expected data:
//
// Sl. No. | USN | Name
//
// ==========================================

router.post(

    "/upload",

    protect,

    authorizeRoles("faculty"),

    upload.single("file"),

    uploadStudents

);


// ==========================================
// FACULTY: GET ALL STUDENTS
// ==========================================

router.get(

    "/",

    protect,

    authorizeRoles("faculty"),

    getStudents

);


router.delete(

    "/",

    protect,

    authorizeRoles("faculty"),

    deleteAllStudents

);


// ==========================================
// MULTER ERROR HANDLER
// ==========================================

router.use(

    (
        error,
        req,
        res,
        next
    ) => {

        if (
            error instanceof
            multer.MulterError
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Upload error: ${error.message}`

            });

        }


        if (
            error
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        next();

    }

);


module.exports =
    router;