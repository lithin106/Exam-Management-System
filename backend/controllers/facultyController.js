const User = require("../models/User");
const Exam = require("../models/Exam");
const Room = require("../models/Room");
const FacultyAllocation = require("../models/FacultyAllocation");

const DEFAULT_FACULTY_POOL = [
    { _id: "fac_default_1", name: "Dr. A. Sharma", employeeId: "EMP101", department: "CSE", email: "asharma@institution.edu" },
    { _id: "fac_default_2", name: "Prof. B. Rao", employeeId: "EMP102", department: "CSE", email: "brao@institution.edu" },
    { _id: "fac_default_3", name: "Dr. C. Kulkarni", employeeId: "EMP103", department: "ECE", email: "ckulkarni@institution.edu" },
    { _id: "fac_default_4", name: "Prof. D. Mehta", employeeId: "EMP104", department: "ISE", email: "dmehta@institution.edu" },
    { _id: "fac_default_5", name: "Dr. E. Verma", employeeId: "EMP105", department: "CSE", email: "everma@institution.edu" },
    { _id: "fac_default_6", name: "Prof. F. Nambiar", employeeId: "EMP106", department: "ME", email: "fnambiar@institution.edu" },
    { _id: "fac_default_7", name: "Dr. G. Gupta", employeeId: "EMP107", department: "EEE", email: "ggupta@institution.edu" },
    { _id: "fac_default_8", name: "Prof. H. Joshi", employeeId: "EMP108", department: "CIVIL", email: "hjoshi@institution.edu" },
    { _id: "fac_default_9", name: "Dr. I. Reddy", employeeId: "EMP109", department: "CSE", email: "ireddy@institution.edu" },
    { _id: "fac_default_10", name: "Prof. J. Nair", employeeId: "EMP110", department: "ISE", email: "jnair@institution.edu" },
    { _id: "fac_default_11", name: "Dr. K. Saxena", employeeId: "EMP111", department: "ECE", email: "ksaxena@institution.edu" },
    { _id: "fac_default_12", name: "Prof. L. Bhat", employeeId: "EMP112", department: "CSE", email: "lbhat@institution.edu" }
];

const getFacultyList = async (req, res) => {
    try {
        const dbUsers = await User.find({ role: "faculty" }).select("-password");
        const formattedUsers = dbUsers.map((u) => ({
            _id: u._id.toString(),
            name: u.name,
            employeeId: u.facultyId || `EMP-${u._id.toString().slice(-4).toUpperCase()}`,
            department: "CSE",
            email: u.email
        }));

        const existingNames = new Set(formattedUsers.map((u) => u.name.toLowerCase()));
        const poolFiltered = DEFAULT_FACULTY_POOL.filter((f) => !existingNames.has(f.name.toLowerCase()));
        const combined = [...formattedUsers, ...poolFiltered];

        res.status(200).json({
            success: true,
            faculty: combined
        });
    } catch (error) {
        console.error("Get faculty list error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch faculty members",
            error: error.message
        });
    }
};

const addFaculty = async (req, res) => {
    try {
        const { name, employeeId, department } = req.body;

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message: "Full Name is required."
            });
        }

        if (!employeeId || !String(employeeId).trim()) {
            return res.status(400).json({
                success: false,
                message: "Employee ID is required."
            });
        }

        const trimmedEmpId = String(employeeId).trim();
        const trimmedName = String(name).trim();
        const trimmedDept = department ? String(department).trim() : "CSE";

        const existingUser = await User.findOne({
            role: "faculty",
            facultyId: { $regex: new RegExp(`^${trimmedEmpId}$`, "i") }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: `Faculty member with Employee ID "${trimmedEmpId}" already exists.`
            });
        }

        const defaultEmail = `${trimmedEmpId.toLowerCase().replace(/[^a-z0-9]/g, "")}@institution.edu`;
        const existingEmailUser = await User.findOne({ email: defaultEmail });
        const finalEmail = existingEmailUser
            ? `${trimmedEmpId.toLowerCase().replace(/[^a-z0-9]/g, "")}_${Date.now()}@institution.edu`
            : defaultEmail;

        const dummyHash = "$2a$10$abcdefghijklmnopqrstuuabcdefghijklmnopqrstuuuuuuu";

        const newUser = await User.create({
            name: trimmedName,
            email: finalEmail,
            password: dummyHash,
            role: "faculty",
            facultyId: trimmedEmpId
        });

        res.status(201).json({
            success: true,
            message: "Faculty member added successfully.",
            faculty: {
                _id: newUser._id.toString(),
                name: newUser.name,
                employeeId: newUser.facultyId,
                department: trimmedDept,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error("Add faculty error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add faculty member.",
            error: error.message
        });
    }
};

const deleteFaculty = async (req, res) => {
    try {
        const { id } = req.params;

        let targetFaculty = null;
        const isValidObjId = id.match(/^[0-9a-fA-F]{24}$/);
        if (isValidObjId) {
            targetFaculty = await User.findById(id);
        }

        const targetEmpId = targetFaculty ? targetFaculty.facultyId : null;
        const targetName = targetFaculty ? targetFaculty.name : null;

        const allAllocations = await FacultyAllocation.find();

        let isAssigned = false;
        for (const alloc of allAllocations) {
            if (Array.isArray(alloc.allocatedFaculty)) {
                for (const item of alloc.allocatedFaculty) {
                    if (item.faculty && item.faculty.toString() === id) {
                        isAssigned = true;
                        break;
                    }
                    if (targetEmpId && item.employeeId && item.employeeId.toLowerCase() === targetEmpId.toLowerCase()) {
                        isAssigned = true;
                        break;
                    }
                    if (targetName && item.facultyName && item.facultyName.toLowerCase() === targetName.toLowerCase()) {
                        isAssigned = true;
                        break;
                    }
                }
            }
            if (isAssigned) break;
        }

        if (isAssigned) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete this faculty member because they are already assigned to an examination."
            });
        }

        if (isValidObjId && targetFaculty) {
            await User.findByIdAndDelete(id);
        }

        res.status(200).json({
            success: true,
            message: "Faculty member deleted successfully."
        });
    } catch (error) {
        console.error("Delete faculty error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete faculty member.",
            error: error.message
        });
    }
};

const getAllocations = async (req, res) => {
    try {
        const allocations = await FacultyAllocation.find()
            .populate("exam")
            .populate("allocatedFaculty.room");

        res.status(200).json({
            success: true,
            allocations
        });
    } catch (error) {
        console.error("Get allocations error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch faculty allocations",
            error: error.message
        });
    }
};

const getExamAllocation = async (req, res) => {
    try {
        const { examId } = req.params;
        const allocation = await FacultyAllocation.findOne({ exam: examId })
            .populate("exam")
            .populate("allocatedFaculty.room");

        if (!allocation) {
            return res.status(404).json({
                success: false,
                message: "No faculty allocation found for this exam."
            });
        }

        res.status(200).json({
            success: true,
            allocation
        });
    } catch (error) {
        console.error("Get exam allocation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch allocation",
            error: error.message
        });
    }
};

const saveAllocation = async (req, res) => {
    try {
        const { examId, selectedFaculty } = req.body;

        if (!examId) {
            return res.status(400).json({
                success: false,
                message: "Examination ID is required."
            });
        }

        if (!Array.isArray(selectedFaculty) || selectedFaculty.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select available faculty members."
            });
        }

        const exam = await Exam.findById(examId).populate("rooms");
        if (!exam) {
            return res.status(404).json({
                success: false,
                message: "Examination not found."
            });
        }

        const examRooms = exam.rooms || [];
        if (selectedFaculty.length !== examRooms.length) {
            return res.status(400).json({
                success: false,
                message: `Selected faculty count (${selectedFaculty.length}) must match classroom count (${examRooms.length}).`
            });
        }

        const shuffledFaculty = [...selectedFaculty].sort(() => Math.random() - 0.5);

        const allocatedFaculty = examRooms.map((roomObj, index) => {
            const fac = shuffledFaculty[index];
            const isValidObjectId = fac._id && String(fac._id).match(/^[0-9a-fA-F]{24}$/);
            return {
                faculty: isValidObjectId ? fac._id : null,
                facultyName: fac.name,
                employeeId: fac.employeeId || "",
                department: fac.department || "CSE",
                room: roomObj._id,
                roomNumber: roomObj.roomNumber
            };
        });

        let existingAllocation = await FacultyAllocation.findOne({ exam: examId });

        if (existingAllocation) {
            existingAllocation.allocatedFaculty = allocatedFaculty;
            existingAllocation.status = "allocated";
            existingAllocation.createdBy = req.user._id;
            await existingAllocation.save();

            const updatedAllocation = await FacultyAllocation.findById(existingAllocation._id)
                .populate("exam")
                .populate("allocatedFaculty.room");

            return res.status(200).json({
                success: true,
                message: "Faculty allocation updated successfully.",
                allocation: updatedAllocation
            });
        } else {
            const newAllocation = await FacultyAllocation.create({
                exam: examId,
                allocatedFaculty,
                status: "allocated",
                createdBy: req.user._id
            });

            const savedAllocation = await FacultyAllocation.findById(newAllocation._id)
                .populate("exam")
                .populate("allocatedFaculty.room");

            return res.status(201).json({
                success: true,
                message: "Faculty allocation completed successfully.",
                allocation: savedAllocation
            });
        }
    } catch (error) {
        console.error("Save allocation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to save faculty allocation.",
            error: error.message
        });
    }
};

const deleteAllocation = async (req, res) => {
    try {
        const { examId } = req.params;
        await FacultyAllocation.findOneAndDelete({ exam: examId });
        res.status(200).json({
            success: true,
            message: "Faculty allocation cleared successfully."
        });
    } catch (error) {
        console.error("Delete allocation error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear allocation.",
            error: error.message
        });
    }
};

module.exports = {
    getFacultyList,
    addFaculty,
    deleteFaculty,
    getAllocations,
    getExamAllocation,
    saveAllocation,
    deleteAllocation
};
