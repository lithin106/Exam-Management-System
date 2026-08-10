const PDFDocument = require("pdfkit");


// ======================================================
// GENERATE SEATING PLAN PDF
// ======================================================

const generateSeatingPDF = (
    exam,
    assignments,
    res
) => {

    const safeExamName =
        exam.examName
            .replace(/[^a-z0-9]/gi, "_");


    const filename =
        `Seating_Plan_${safeExamName}.pdf`;


    // --------------------------------------------------
    // PDF RESPONSE HEADERS
    // --------------------------------------------------

    res.setHeader(
        "Content-Type",
        "application/pdf"
    );

    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
    );


    // --------------------------------------------------
    // CREATE PDF
    // --------------------------------------------------

    const doc =
        new PDFDocument({
            size: "A4",
            margin: 40
        });


    doc.pipe(res);


    // ==================================================
    // TITLE
    // ==================================================

    doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text(
            "EXAMINATION SEATING ARRANGEMENT",
            {
                align: "center"
            }
        );


    doc.moveDown();


    // ==================================================
    // EXAM DETAILS
    // ==================================================

    doc
        .fontSize(11)
        .font("Helvetica");


    doc.text(
        `Examination: ${exam.examName}`
    );

    doc.text(
        `Subject: ${exam.subject}`
    );

    doc.text(
        `Date: ${new Date(
            exam.examDate
        ).toLocaleDateString("en-IN")}`
    );

    doc.text(
        `Time: ${exam.startTime} - ${exam.endTime}`
    );

    doc.text(
        `Semester: ${exam.semester}`
    );

    doc.text(
        `Departments: ${exam.departments.join(
            ", "
        )}`
    );


    doc.moveDown();

    doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .stroke();


    doc.moveDown();


    // ==================================================
    // GROUP BY ROOM
    // ==================================================

    const rooms = {};


    assignments.forEach(
        assignment => {

            const roomId =
                assignment.room._id
                    ? assignment.room._id.toString()
                    : assignment.room.toString();


            if (!rooms[roomId]) {

                rooms[roomId] = [];

            }


            rooms[roomId].push(
                assignment
            );

        }
    );


    // ==================================================
    // ROOM-WISE PDF
    // ==================================================

    Object.values(rooms).forEach(
        roomAssignments => {

            const room =
                roomAssignments[0].room;


            // ------------------------------------------------
            // NEW PAGE IF NECESSARY
            // ------------------------------------------------

            if (
                doc.y > 680
            ) {

                doc.addPage();

            }


            // ------------------------------------------------
            // ROOM HEADER
            // ------------------------------------------------

            doc
                .fontSize(15)
                .font("Helvetica-Bold")
                .text(
                    `Room: ${
                        room.roomNumber ||
                        "N/A"
                    }`
                );


            doc
                .fontSize(10)
                .font("Helvetica")
                .text(
                    `Building: ${
                        room.building ||
                        "-"
                    }`
                );


            doc.text(
                `Floor: ${
                    room.floor ||
                    "-"
                }`
            );


            doc.text(
                `Students Assigned: ${
                    roomAssignments.length
                }`
            );


            doc.moveDown();


            // ------------------------------------------------
            // TABLE HEADER
            // ------------------------------------------------

            const startX = 40;

            const seatX = 40;

            const idX = 150;

            const nameX = 250;

            const deptX = 430;


            const drawHeader = () => {

                const y =
                    doc.y;


                doc
                    .font("Helvetica-Bold")
                    .fontSize(9);


                doc.text(
                    "Seat",
                    seatX,
                    y
                );


                doc.text(
                    "Student ID",
                    idX,
                    y
                );


                doc.text(
                    "Student Name",
                    nameX,
                    y
                );


                doc.text(
                    "Department",
                    deptX,
                    y
                );


                doc
                    .moveTo(
                        startX,
                        y + 15
                    )
                    .lineTo(
                        555,
                        y + 15
                    )
                    .stroke();


                doc.y =
                    y + 20;

            };


            drawHeader();


            // ------------------------------------------------
            // SORT SEATS
            // ------------------------------------------------

            const sortedAssignments =
                [...roomAssignments]
                    .sort(
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


            // ------------------------------------------------
            // TABLE ROWS
            // ------------------------------------------------

            sortedAssignments.forEach(
                assignment => {

                    if (
                        doc.y > 750
                    ) {

                        doc.addPage();

                        drawHeader();

                    }


                    const y =
                        doc.y;


                    doc
                        .font("Helvetica")
                        .fontSize(8);


                    doc.text(
                        assignment.seatNumber ||
                        "-",
                        seatX,
                        y,
                        {
                            width: 100
                        }
                    );


                    doc.text(
                        assignment.studentId ||
                        assignment.student?.studentId ||
                        "-",
                        idX,
                        y,
                        {
                            width: 90
                        }
                    );


                    doc.text(
                        assignment.studentName ||
                        assignment.student?.name ||
                        "-",
                        nameX,
                        y,
                        {
                            width: 170
                        }
                    );


                    doc.text(
                        assignment.department ||
                        assignment.student?.department ||
                        "-",
                        deptX,
                        y,
                        {
                            width: 100
                        }
                    );


                    doc.y =
                        y + 18;

                }
            );


            doc.moveDown();

        }
    );


    // ==================================================
    // FOOTER
    // ==================================================

    doc
        .fontSize(9)
        .font("Helvetica")
        .text(
            "Generated automatically by Exam Seating Arrangement System.",
            40,
            780,
            {
                align: "center",
                width: 515
            }
        );


    // ==================================================
    // FINISH PDF
    // ==================================================

    doc.end();

};


module.exports = {
    generateSeatingPDF
};