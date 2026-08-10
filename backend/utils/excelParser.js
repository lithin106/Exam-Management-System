const XLSX = require("xlsx");

const parseStudentExcel = (filePath) => {

    const workbook = XLSX.readFile(filePath);

    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    const students = XLSX.utils.sheet_to_json(worksheet);

    return students.map((student) => ({
        studentId: String(student.studentId || "").trim(),

        name: String(student.name || "").trim(),

        email: String(student.email || "").trim(),

        department: String(student.department || "").trim(),

        year: String(student.year || "").trim(),

        section: String(student.section || "").trim(),

        semester: String(student.semester || "").trim(),

        phone: String(student.phone || "").trim(),

        isEligible:
            student.isEligible === undefined
                ? true
                : Boolean(student.isEligible)
    }));
};

module.exports = parseStudentExcel;