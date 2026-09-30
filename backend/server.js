const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();


// ==========================================
// DATABASE
// ==========================================

const connectDB = require("./config/db");


// ==========================================
// ROUTES
// ==========================================

const authRoutes =
    require("./routes/authRoutes");

const facultyRoutes =
    require("./routes/facultyRoutes");

const studentRoutes =
    require("./routes/studentRoutes");

const roomRoutes =
    require("./routes/roomRoutes");

const examRoutes =
    require("./routes/examRoutes");

const seatingRoutes =
    require("./routes/seatingRoutes");

const studentPortalRoutes =
    require("./routes/studentPortalRoutes");


// ==========================================
// EXPRESS APPLICATION
// ==========================================

const app = express();


// ==========================================
// DATABASE CONNECTION
// ==========================================

connectDB();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ==========================================
// API ROUTES
// ==========================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/faculty",
    facultyRoutes
);

app.use(
    "/api/student",
    studentRoutes
);

app.use(
    "/api/rooms",
    roomRoutes
);

app.use(
    "/api/exams",
    examRoutes
);

app.use(
    "/api/seating",
    seatingRoutes
);

app.use(
    "/api/student-portal",
    studentPortalRoutes
);


// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Exam Seating Arrangement API is running",

        version:
            "1.0.0"

    });

});


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API route not found"

    });

});


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Server Error:",
            err
        );

        res.status(500).json({

            success: false,

            message:
                "Internal server error",

            error:
                err.message

        });

    }
);


// ==========================================
// START SERVER
// ==========================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(
            `Server running on http://localhost:${PORT}`
        );

    }
);