// ======================================================
// AUTOMATED EXAM SEATING ALGORITHM
// ======================================================
//
// Goals:
// 1. Assign eligible students
// 2. Respect classroom capacity
// 3. Use minimum number of rooms
// 4. Fill rooms efficiently before opening another room
// 5. Allocate seats row-wise and column-wise
// 6. Mix departments where possible
// 7. Keep allocation deterministic
// ======================================================


// ======================================================
// GENERATE SEATS ROOM BY ROOM
// ======================================================

const generateSeats = (rooms, studentCount) => {

    const seats = [];

    let remainingStudents = studentCount;


    for (const room of rooms) {

        if (remainingStudents <= 0) {
            break;
        }


        const seatsToUse =
            Math.min(
                room.capacity,
                remainingStudents
            );


        let seatsAdded = 0;


        for (
            let row = 1;
            row <= room.rows;
            row++
        ) {

            for (
                let column = 1;
                column <= room.columns;
                column++
            ) {

                if (
                    seatsAdded >= seatsToUse
                ) {
                    break;
                }


                seats.push({

                    room,

                    row,

                    column,

                    seatNumber:
                        `${room.roomNumber}-R${row}-C${column}`

                });


                seatsAdded++;

            }


            if (
                seatsAdded >= seatsToUse
            ) {
                break;
            }

        }


        remainingStudents -= seatsAdded;

    }


    return seats;

};


// ======================================================
// GROUP STUDENTS BY DEPARTMENT
// ======================================================

const groupByDepartment = (students) => {

    const departments = {};


    for (const student of students) {

        const department =
            student.department || "UNKNOWN";


        if (
            !departments[department]
        ) {

            departments[department] = [];

        }


        departments[department].push(
            student
        );

    }


    return departments;

};


// ======================================================
// CREATE ORDERED STUDENT LIST
// ======================================================
//
// We take students from different departments
// one after another whenever possible.
//
// Example:
//
// CSE1
// ME1
// ECE1
// CSE2
// ME2
// ECE2
//
// instead of:
//
// CSE1
// CSE2
// CSE3
// ME1
// ME2
//
// ======================================================

const createDepartmentMixedOrder = (
    students
) => {

    const departments =
        groupByDepartment(students);


    const departmentNames =
        Object.keys(departments);


    // Sort departments by number
    // of remaining students.
    //
    // Largest department first.

    departmentNames.sort(
        (a, b) =>
            departments[b].length -
            departments[a].length
    );


    const orderedStudents = [];


    while (
        departmentNames.some(
            department =>
                departments[department].length > 0
        )
    ) {


        // Re-sort after every round
        // so departments with more
        // remaining students get used.

        departmentNames.sort(
            (a, b) =>
                departments[b].length -
                departments[a].length
        );


        for (
            const department
            of departmentNames
        ) {

            if (
                departments[department].length === 0
            ) {

                continue;

            }


            const student =
                departments[
                    department
                ].shift();


            orderedStudents.push(
                student
            );

        }

    }


    return orderedStudents;

};


// ======================================================
// MAIN ALGORITHM
// ======================================================

const generateSeatingPlan = (
    students,
    rooms
) => {


    // --------------------------------------------------
    // SORT ROOMS BY CAPACITY
    // --------------------------------------------------
    //
    // Largest room first.
    //
    // Example:
    //
    // Room A = 60
    // Room B = 30
    // Room C = 30
    //
    // 45 students:
    //
    // Room A → 45
    // Room B → 0
    // Room C → 0
    //
    // --------------------------------------------------

    const sortedRooms =
        [...rooms].sort(
            (a, b) =>
                b.capacity -
                a.capacity
        );


    // --------------------------------------------------
    // CREATE ONLY THE REQUIRED NUMBER OF SEATS
    // --------------------------------------------------

    const seats =
        generateSeats(
            sortedRooms,
            students.length
        );


    // --------------------------------------------------
    // CREATE DETERMINISTIC STUDENT ORDER
    // --------------------------------------------------

    const orderedStudents =
        createDepartmentMixedOrder(
            students
        );


    const assignments = [];


    // --------------------------------------------------
    // ASSIGN STUDENTS
    // --------------------------------------------------

    const assignmentCount =
        Math.min(
            orderedStudents.length,
            seats.length
        );


    for (
        let i = 0;
        i < assignmentCount;
        i++
    ) {

        const student =
            orderedStudents[i];


        const seat =
            seats[i];


        assignments.push({

            student,

            room:
                seat.room,

            row:
                seat.row,

            column:
                seat.column,

            seatNumber:
                seat.seatNumber,

            department:
                student.department

        });

    }


    // --------------------------------------------------
    // FIND UNASSIGNED STUDENTS
    // --------------------------------------------------

    const assignedStudentIds =
        new Set(
            assignments.map(
                assignment =>
                    assignment.student._id.toString()
            )
        );


    const unassignedStudents =
        students.filter(
            student =>
                !assignedStudentIds.has(
                    student._id.toString()
                )
        );


    // --------------------------------------------------
    // DETERMINE ROOMS ACTUALLY USED
    // --------------------------------------------------

    const usedRoomIds =
        new Set(
            assignments.map(
                assignment =>
                    assignment.room._id.toString()
            )
        );


    // --------------------------------------------------
    // RETURN RESULT
    // --------------------------------------------------

    return {

        assignments,

        unassignedStudents,

        totalStudents:
            students.length,

        assignedStudents:
            assignments.length,

        unassignedCount:
            unassignedStudents.length,

        totalSeats:
            seats.length,

        usedRooms:
            usedRoomIds.size,

        totalRooms:
            sortedRooms.length

    };

};


module.exports = {

    generateSeatingPlan

};