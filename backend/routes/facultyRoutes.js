const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

const router = express.Router();

// Faculty-only route
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

module.exports = router;