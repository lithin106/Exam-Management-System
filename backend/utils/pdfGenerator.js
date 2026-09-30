const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const DESK_COLUMNS = {
    left:   [1, 2, 3],
    middle: [4, 5, 6],
    right:  [7, 8, 9]
};

const getBlockedCells = (room, roomConfigurations) => {
    const blocked = new Set();
    if (!Array.isArray(roomConfigurations) || roomConfigurations.length === 0) {
        return blocked;
    }

    const roomId = room?._id ? room._id.toString() : String(room?.roomNumber || "");

    for (const config of roomConfigurations) {
        const cId = config.room?._id
            ? config.room._id.toString()
            : config.room
                ? String(config.room)
                : "";

        if (cId === roomId && Array.isArray(config.defectiveDesks)) {
            config.defectiveDesks.forEach(({ row, desk }) => {
                const cols = DESK_COLUMNS[desk];
                if (cols) {
                    cols.forEach(col => blocked.add(`${row}-${col}`));
                }
            });
            break;
        }
    }

    return blocked;
};

const generateSeatingPDF = (
    exam,
    assignments,
    res,
    roomConfigurations
) => {
    try {
        const doc =
            new PDFDocument({
                size: "A4",
                layout: "landscape",
                margins: {
                    top: 25,
                    bottom: 25,
                    left: 25,
                    right: 25
                }
            });

        const pageWidth =
            doc.page.width;

        const margin = 25;

        const usableWidth =
            pageWidth -
            margin * 2;

        const safeExamName =
            String(
                exam.examName ||
                "Exam"
            ).replace(
                /[^a-z0-9]/gi,
                "_"
            );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Seating_Plan_${safeExamName}.pdf"`
        );

        doc.pipe(res);

        const roomGroups = [];
        const roomMap = new Map();

        assignments.forEach(
            assignment => {
                const roomId =
                    assignment.room?._id
                        ? assignment.room._id.toString()
                        : String(
                            assignment.room
                        );

                if (!roomMap.has(roomId)) {
                    const group = [];

                    roomMap.set(
                        roomId,
                        group
                    );

                    roomGroups.push(
                        group
                    );
                }

                roomMap
                    .get(roomId)
                    .push(
                        assignment
                    );
            }
        );

        if (
            roomGroups.length === 0
        ) {
            doc
                .font("Helvetica-Bold")
                .fontSize(16)
                .text(
                    "No seating assignments found.",
                    margin,
                    margin
                );

            doc.end();
            return;
        }

        roomGroups.forEach(
            (
                roomStudents,
                roomIndex
            ) => {
                if (roomIndex > 0) {
                    doc.addPage();
                }

                roomStudents.sort(
                    (a, b) => {
                        if (
                            a.row !==
                            b.row
                        ) {
                            return (
                                a.row -
                                b.row
                            );
                        }

                        return (
                            a.column -
                            b.column
                        );
                    }
                );

                const room =
                    roomStudents[0]?.room;

                const roomNumber =
                    room?.roomNumber ||
                    "Room";

                let currentY =
                    margin;

                let templateUsed =
                    false;

                if (
                    exam.outputTemplate
                ) {
                    let templatePath =
                        exam.outputTemplate;

                    if (
                        !path.isAbsolute(
                            templatePath
                        )
                    ) {
                        templatePath =
                            path.resolve(
                                process.cwd(),
                                templatePath
                            );
                    }

                    if (
                        fs.existsSync(
                            templatePath
                        )
                    ) {
                        try {
                            doc.image(
                                templatePath,
                                margin,
                                currentY,
                                {
                                    fit: [
                                        usableWidth,
                                        175
                                    ],
                                    align:
                                        "center",
                                    valign:
                                        "top"
                                }
                            );

                            templateUsed =
                                true;

                            currentY +=
                                185;

                        } catch (
                            error
                        ) {
                            console.error(
                                error
                            );
                        }
                    }
                }

                if (!templateUsed) {
                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(16)
                        .text(
                            "Exam Management System - Seating Plan",
                            margin,
                            currentY,
                            {
                                width:
                                    usableWidth,
                                align:
                                    "center"
                            }
                        );

                    currentY +=
                        25;

                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(12)
                        .text(
                            `Exam: ${exam.examName || ""}`,
                            margin,
                            currentY,
                            {
                                width:
                                    usableWidth,
                                align:
                                    "center"
                            }
                        );

                    currentY +=
                        20;
                }

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(12)
                    .text(
                        `Room Number: ${roomNumber}`,
                        margin,
                        currentY,
                        {
                            width:
                                usableWidth,
                            align:
                                "center"
                        }
                    );

                currentY +=
                    25;

                const deskCount =
                    3;

                const positionsPerDesk =
                    3;

                const totalColumns =
                    deskCount *
                    positionsPerDesk;

                const slWidth =
                    35;

                const deskWidth =
                    (
                        usableWidth -
                        slWidth
                    ) /
                    deskCount;

                const cellWidth =
                    deskWidth /
                    positionsPerDesk;

                const deskHeaderHeight =
                    20;

                const semesterHeaderHeight =
                    18;

                const positionHeaderHeight =
                    20;

                const rowHeight =
                    28;

                const tableX =
                    margin;

                const tableY =
                    currentY;

                const headerHeight =
                    deskHeaderHeight +
                    semesterHeaderHeight +
                    positionHeaderHeight;

                doc
                    .rect(
                        tableX,
                        tableY,
                        slWidth,
                        headerHeight
                    )
                    .stroke();

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(8)
                    .text(
                        "Row",
                        tableX,
                        tableY + 25,
                        {
                            width:
                                slWidth,
                            align:
                                "center"
                        }
                    );

                const deskNames = [
                    "Left Desk",
                    "Middle Desk",
                    "Right Desk"
                ];

                const examSemester =
                    String(
                        exam.semester ||
                        ""
                    );

                for (
                    let deskIndex = 0;
                    deskIndex <
                    deskCount;
                    deskIndex++
                ) {
                    const deskX =
                        tableX +
                        slWidth +
                        deskIndex *
                        deskWidth;

                    doc
                        .rect(
                            deskX,
                            tableY,
                            deskWidth,
                            deskHeaderHeight
                        )
                        .stroke();

                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(8)
                        .text(
                            deskNames[
                                deskIndex
                            ],
                            deskX,
                            tableY + 6,
                            {
                                width:
                                    deskWidth,
                                align:
                                    "center"
                            }
                        );

                    const semesterY =
                        tableY +
                        deskHeaderHeight;

                    doc
                        .rect(
                            deskX,
                            semesterY,
                            deskWidth,
                            semesterHeaderHeight
                        )
                        .stroke();

                    doc
                        .font(
                            "Helvetica-Bold"
                        )
                        .fontSize(8)
                        .text(
                            examSemester,
                            deskX,
                            semesterY + 5,
                            {
                                width:
                                    deskWidth,
                                align:
                                    "center"
                            }
                        );

                    const positionY =
                        semesterY +
                        semesterHeaderHeight;

                    for (
                        let position = 0;
                        position <
                        positionsPerDesk;
                        position++
                    ) {
                        const x =
                            deskX +
                            position *
                            cellWidth;

                        doc
                            .rect(
                                x,
                                positionY,
                                cellWidth,
                                positionHeaderHeight
                            )
                            .stroke();

                        const columnNumber =
                            deskIndex *
                            positionsPerDesk +
                            position +
                            1;

                        doc
                            .font(
                                "Helvetica-Bold"
                            )
                            .fontSize(8)
                            .text(
                                "C" + columnNumber,
                                x,
                                positionY + 6,
                                {
                                    width:
                                        cellWidth,
                                    align:
                                        "center"
                                }
                            );
                    }
                }

                const lookup = {};

                roomStudents.forEach(
                    assignment => {
                        lookup[
                            `${assignment.row}-${assignment.column}`
                        ] =
                            assignment;
                    }
                );

                const blocked = getBlockedCells(room, roomConfigurations || []);

                const roomRows =
                    Number(
                        room?.rows ||
                        1
                    );

                const dataY =
                    tableY +
                    headerHeight;

                for (
                    let row = 1;
                    row <= roomRows;
                    row++
                ) {
                    const y =
                        dataY +
                        (
                            row - 1
                        ) *
                        rowHeight;

                    doc
                        .rect(
                            tableX,
                            y,
                            slWidth,
                            rowHeight
                        )
                        .stroke();

                    doc
                        .font(
                            "Helvetica"
                        )
                        .fontSize(8)
                        .text(
                            "R" + row,
                            tableX,
                            y + 9,
                            {
                                width:
                                    slWidth,
                                align:
                                    "center"
                            }
                        );

                    for (
                        let column = 1;
                        column <= totalColumns;
                        column++
                    ) {
                        const deskIndex =
                            Math.floor(
                                (
                                    column - 1
                                ) /
                                positionsPerDesk
                            );

                        const positionIndex =
                            (
                                column - 1
                            ) %
                            positionsPerDesk;

                        const deskX =
                            tableX +
                            slWidth +
                            deskIndex *
                            deskWidth;

                        const x =
                            deskX +
                            positionIndex *
                            cellWidth;

                        doc
                            .rect(
                                x,
                                y,
                                cellWidth,
                                rowHeight
                            )
                            .stroke();

                        const isBlocked = blocked.has(`${row}-${column}`);

                        if (isBlocked) {
                            doc
                                .save()
                                .rect(
                                    x,
                                    y,
                                    cellWidth,
                                    rowHeight
                                )
                                .fill("#e5e7eb");

                            doc
                                .rect(
                                    x,
                                    y,
                                    cellWidth,
                                    rowHeight
                                )
                                .stroke();

                            doc
                                .restore();
                        } else {
                            const assignment =
                                lookup[
                                    `${row}-${column}`
                                ];

                            if (
                                assignment
                            ) {
                                const usn =
                                    assignment.studentId ||
                                    assignment.student?.studentId ||
                                    "";

                                doc
                                    .font(
                                        "Helvetica"
                                    )
                                    .fontSize(7)
                                    .text(
                                        usn,
                                        x + 2,
                                        y + 9,
                                        {
                                            width:
                                                cellWidth -
                                                4,
                                            align:
                                                "center"
                                        }
                                    );
                            }
                        }
                    }
                }

                const totalY =
                    dataY +
                    roomRows *
                    rowHeight +
                    18;

                doc
                    .font(
                        "Helvetica-Bold"
                    )
                    .fontSize(9)
                    .text(
                        `TOTAL No. of students: ${roomStudents.length}`,
                        margin,
                        totalY
                    );

                const signatureY =
                    totalY + 35;

                doc
                    .font(
                        "Helvetica"
                    )
                    .fontSize(8)
                    .text(
                        "IA Co-ordinator",
                        margin,
                        signatureY
                    );

                doc
                    .text(
                        "Head of the Department",
                        pageWidth -
                        margin -
                        140,
                        signatureY
                    );
            }
        );

        doc.end();

    } catch (error) {
        console.error(
            "PDF generation error:",
            error
        );

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message:
                    "Failed to generate seating PDF",
                error:
                    error.message
            });
        }
    }
};

module.exports = {
    generateSeatingPDF
};