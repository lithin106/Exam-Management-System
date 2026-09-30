const XLSX = require("xlsx");

const clean = (value) => {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");
};

const normalizeHeader = (value) => {
    return clean(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
};

const detectDepartment = (studentId) => {
    const usn = clean(studentId).toUpperCase();

    if (usn.includes("CS")) {
        return "CSE";
    }

    if (usn.includes("EC")) {
        return "ECE";
    }

    if (usn.includes("ME")) {
        return "ME";
    }

    if (usn.includes("IS")) {
        return "ISE";
    }

    if (usn.includes("AI")) {
        return "AI";
    }

    return "UNKNOWN";
};

const findHeaderRow = (rawRows) => {
    for (let rowIndex = 0; rowIndex < rawRows.length; rowIndex++) {
        const row = rawRows[rowIndex];

        const normalized = row.map(normalizeHeader);

        const hasUSN = normalized.some(
            value => value === "USN"
        );

        const hasName = normalized.some(
            value =>
                value === "NAMEOFTHESTUDENT" ||
                value === "NAME"
        );

        if (hasUSN && hasName) {
            return rowIndex;
        }
    }

    return -1;
};

const parseSheet = (worksheet, sheetName) => {
    const rawRows = XLSX.utils.sheet_to_json(
        worksheet,
        {
            header: 1,
            defval: ""
        }
    );

    if (!rawRows.length) {
        return [];
    }

    const headerRowIndex = findHeaderRow(rawRows);

    if (headerRowIndex === -1) {
        return [];
    }

    const headerRow = rawRows[headerRowIndex];

    const columns = {};

    headerRow.forEach((header, index) => {
        const normalized = normalizeHeader(header);

        if (normalized === "USN") {
            columns.usn = index;
        }

        if (
            normalized === "NAMEOFTHESTUDENT" ||
            normalized === "NAME"
        ) {
            columns.name = index;
        }

        if (
            normalized === "LABBATCH" ||
            normalized === "LAB"
        ) {
            columns.labBatch = index;
        }

        if (normalized === "SLNO") {
            columns.slNo = index;
        }
    });

    if (
        columns.usn === undefined ||
        columns.name === undefined
    ) {
        return [];
    }

    const section = ["A", "B", "C"].includes(
        clean(sheetName).toUpperCase()
    )
        ? clean(sheetName).toUpperCase()
        : "";

    if (!section) {
        return [];
    }

    const students = [];

    for (
        let i = headerRowIndex + 1;
        i < rawRows.length;
        i++
    ) {
        const row = rawRows[i];

        const studentId = clean(
            row[columns.usn]
        );

        const name = clean(
            row[columns.name]
        );

        const labBatch =
            columns.labBatch !== undefined
                ? clean(row[columns.labBatch])
                : "";

        if (!studentId || !name) {
            continue;
        }

        const upperId =
            studentId.toUpperCase();

        if (
            upperId === "USN" ||
            upperId === "SL.NO"
        ) {
            continue;
        }

        if (!/[A-Z]{2,}/i.test(studentId)) {
            continue;
        }

        const department =
            detectDepartment(studentId);

        students.push({
            studentId,
            name,
            department,
            section,
            semester: "7",
            labBatch,
            isEligible: true
        });
    }

    return students;
};

const parseStudentExcel = (filePath) => {
    const workbook =
        XLSX.readFile(filePath);

    const allowedSheets = [
        "A",
        "B",
        "C"
    ];

    const allStudents = [];

    for (const sheetName of allowedSheets) {
        const actualSheetName =
            workbook.SheetNames.find(
                name =>
                    clean(name).toUpperCase() ===
                    sheetName
            );

        if (!actualSheetName) {
            continue;
        }

        const worksheet =
            workbook.Sheets[actualSheetName];

        const students =
            parseSheet(
                worksheet,
                sheetName
            );

        allStudents.push(...students);
    }

    const uniqueStudents =
        new Map();

    for (const student of allStudents) {
        const key =
            student.studentId.toUpperCase();

        if (!uniqueStudents.has(key)) {
            uniqueStudents.set(
                key,
                student
            );
        }
    }

    return Array.from(
        uniqueStudents.values()
    );
};

module.exports =
    parseStudentExcel;