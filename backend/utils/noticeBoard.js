const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const getRoomNumber = (assignment) => {
    if (!assignment || !assignment.room) {
        return "";
    }

    return String(
        assignment.room.roomNumber || ""
    ).trim();
};

const getStudentId = (assignment) => {
    return String(
        assignment.studentId ||
        assignment.student?.studentId ||
        ""
    ).trim();
};

const naturalCompare = (a, b) => {
    return String(a).localeCompare(
        String(b),
        undefined,
        {
            numeric: true,
            sensitivity: "base"
        }
    );
};

const generateNoticeBoardPDF = (
    assignments,
    examOrName = "Internal Assessment 1"
) => {

    return new Promise((resolve, reject) => {

        try {
            const examName =
                typeof examOrName === "object"
                    ? (examOrName.examName || examOrName.subject || "Internal Assessment")
                    : String(examOrName || "Internal Assessment");

            const outputTemplate =
                typeof examOrName === "object"
                    ? examOrName.outputTemplate
                    : null;

            const roomMap = new Map();

            for (const assignment of assignments || []) {

                const roomNumber =
                    getRoomNumber(assignment);

                const studentId =
                    getStudentId(assignment);

                if (!roomNumber || !studentId) {
                    continue;
                }

                if (!roomMap.has(roomNumber)) {
                    roomMap.set(
                        roomNumber,
                        []
                    );
                }

                roomMap
                    .get(roomNumber)
                    .push(studentId);

            }

            const rooms =
                Array.from(
                    roomMap.entries()
                )
                .map(
                    ([roomNumber, students]) => {

                        const uniqueStudents =
                            Array.from(
                                new Set(students)
                            );

                        return {
                            roomNumber,
                            students:
                                uniqueStudents,
                            firstUSN:
                                uniqueStudents[0] || "",
                            lastUSN:
                                uniqueStudents[
                                    uniqueStudents.length - 1
                                ] || ""
                        };

                    }
                )
                .sort(
                    (a, b) =>
                        naturalCompare(
                            a.roomNumber,
                            b.roomNumber
                        )
                );

            const doc =
                new PDFDocument({
                    size: "A4",
                    layout: "landscape",
                    margins: {
                        top: 25,
                        bottom: 25,
                        left: 45,
                        right: 45
                    }
                });

            const chunks = [];

            doc.on(
                "data",
                chunk => {
                    chunks.push(chunk);
                }
            );

            doc.on(
                "end",
                () => {
                    resolve(
                        Buffer.concat(chunks)
                    );
                }
            );

            doc.on(
                "error",
                error => {
                    reject(error);
                }
            );

            const pageWidth =
                doc.page.width;

            const pageHeight =
                doc.page.height;

            const left =
                doc.page.margins.left;

            const right =
                pageWidth -
                doc.page.margins.right;

            const tableWidth =
                right - left;

            let currentY = 28;
            let templateUsed = false;

            if (outputTemplate) {
                let templatePath = outputTemplate;
                if (!path.isAbsolute(templatePath)) {
                    templatePath = path.resolve(process.cwd(), templatePath);
                }

                if (fs.existsSync(templatePath)) {
                    try {
                        doc.image(templatePath, left, currentY, {
                            fit: [tableWidth, 80],
                            align: "center",
                            valign: "top"
                        });
                        templateUsed = true;
                        currentY += 88;
                    } catch (imgError) {
                        console.error("Notice board header image error:", imgError);
                    }
                }
            }

            if (!templateUsed) {
                doc
                    .font("Helvetica-Bold")
                    .fontSize(14)
                    .text(
                        "Department of Computer Science & Engineering",
                        left,
                        currentY,
                        {
                            width: tableWidth,
                            align: "center"
                        }
                    );

                currentY += 20;
            }

            doc
                .font("Helvetica-Bold")
                .fontSize(13)
                .text(
                    "EXAM SEATING ARRANGEMENT - NOTICE BOARD",
                    left,
                    currentY,
                    {
                        width: tableWidth,
                        align: "center"
                    }
                );

            currentY += 18;

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    `Exam: ${examName}`,
                    left,
                    currentY,
                    {
                        width: tableWidth,
                        align: "center"
                    }
                );

            currentY += 18;

            doc
                .font("Helvetica-Bold")
                .fontSize(12)
                .text(
                    "ROOM ALLOTMENT",
                    left,
                    currentY,
                    {
                        width: tableWidth,
                        align: "center"
                    }
                );

            currentY += 20;

            const tableTop = currentY;

            const rowHeight = 28;

            const headerHeight = 28;

            const roomWidth =
                tableWidth * 0.28;

            const rangeWidth =
                tableWidth * 0.72;

            const roomX =
                left;

            const rangeX =
                left + roomWidth;

            doc
                .rect(
                    roomX,
                    tableTop,
                    roomWidth,
                    headerHeight
                )
                .stroke();

            doc
                .rect(
                    rangeX,
                    tableTop,
                    rangeWidth,
                    headerHeight
                )
                .stroke();

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(
                    "Room No.",
                    roomX,
                    tableTop + 9,
                    {
                        width: roomWidth,
                        align: "center"
                    }
                );

            doc
                .font("Helvetica-Bold")
                .fontSize(11)
                .text(
                    "USN Range",
                    rangeX,
                    tableTop + 9,
                    {
                        width: rangeWidth,
                        align: "center"
                    }
                );

            let rowY =
                tableTop +
                headerHeight;

            const signatureBlockHeight = 60;

            for (
                const room
                of rooms
            ) {

                if (
                    rowY +
                    rowHeight +
                    signatureBlockHeight >
                    pageHeight - doc.page.margins.bottom
                ) {

                    doc.addPage();

                    rowY = 40;

                    doc
                        .font("Helvetica-Bold")
                        .fontSize(13)
                        .text(
                            "ROOM ALLOTMENT (Continued)",
                            left,
                            rowY,
                            {
                                width: tableWidth,
                                align: "center"
                            }
                        );

                    rowY += 24;

                }

                doc
                    .rect(
                        roomX,
                        rowY,
                        roomWidth,
                        rowHeight
                    )
                    .stroke();

                doc
                    .rect(
                        rangeX,
                        rowY,
                        rangeWidth,
                        rowHeight
                    )
                    .stroke();

                doc
                    .font("Helvetica-Bold")
                    .fontSize(11)
                    .text(
                        room.roomNumber,
                        roomX,
                        rowY + 9,
                        {
                            width: roomWidth,
                            align: "center"
                        }
                    );

                const rangeText =
                    room.firstUSN ===
                    room.lastUSN
                        ? room.firstUSN
                        : `${room.firstUSN} - ${room.lastUSN}`;

                doc
                    .font("Helvetica")
                    .fontSize(10)
                    .text(
                        rangeText,
                        rangeX,
                        rowY + 9,
                        {
                            width: rangeWidth,
                            align: "center"
                        }
                    );

                rowY += rowHeight;

            }

            const totalStudents =
                assignments.length;

            const footerY = rowY + 16;

            doc
                .font("Helvetica-Bold")
                .fontSize(10)
                .text(
                    `TOTAL No. of students: ${totalStudents}`,
                    left,
                    footerY
                );

            const signatureY = footerY + 28;

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "IA Co-ordinator",
                    left,
                    signatureY
                );

            doc
                .font("Helvetica")
                .fontSize(10)
                .text(
                    "Head of the Department",
                    right - 140,
                    signatureY,
                    {
                        width: 140,
                        align: "right"
                    }
                );

            doc.end();

        } catch (error) {

            reject(error);

        }

    });

};

module.exports = {
    generateNoticeBoardPDF
};