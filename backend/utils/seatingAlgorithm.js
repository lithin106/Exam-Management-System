const DESK_COLUMNS = {
    left:   [1, 3],
    middle: [4, 6],
    right:  [7, 9]
};

const getDefectiveSet = (defectiveDesks) => {
    const blocked = new Set();
    if (!Array.isArray(defectiveDesks)) return blocked;

    defectiveDesks.forEach(({ row, desk }) => {
        const cols = DESK_COLUMNS[desk];
        if (cols) {
            cols.forEach(col => {
                blocked.add(`${row}-${col}`);
            });
        }
    });

    return blocked;
};

const getRoomDefectiveDesks = (room, roomConfigurations) => {
    if (!Array.isArray(roomConfigurations) || roomConfigurations.length === 0) {
        return [];
    }

    const roomId = room._id ? room._id.toString() : String(room.roomNumber);

    for (const config of roomConfigurations) {
        const configRoomId = config.room?._id
            ? config.room._id.toString()
            : config.room
                ? String(config.room)
                : "";

        if (configRoomId === roomId) {
            return config.defectiveDesks || [];
        }
    }

    return [];
};

const generateSeatingPlan = (students, rooms, roomConfigurations) => {
    const eligibleStudents = students.filter(
        student => student.isEligible !== false
    );

    const orderedStudents = [...eligibleStudents];

    const orderedRooms = [...rooms];

    const assignments = [];
    const assignedStudentIds = new Set();

    let studentIndex = 0;

    for (const room of orderedRooms) {
        const rows = Number(room.rows) || 0;
        const columns = Number(room.columns) || 0;

        if (rows <= 0 || columns <= 0) {
            continue;
        }

        const usableColumns = [];

        if (columns >= 2) {
            usableColumns.push(1);
            usableColumns.push(3);
        }

        if (columns >= 4) {
            usableColumns.push(4);
            usableColumns.push(6);
        }

        if (columns >= 6) {
            usableColumns.push(7);
            usableColumns.push(9);
        }

        if (usableColumns.length === 0) {
            for (let column = 1; column <= columns; column++) {
                if (column % 2 === 1) {
                    usableColumns.push(column);
                }
            }
        }

        const defectiveDesks = getRoomDefectiveDesks(room, roomConfigurations);
        const blocked = getDefectiveSet(defectiveDesks);

        let roomSeatNumber = 1;

        for (const column of usableColumns) {
            for (let row = 1; row <= rows; row++) {
                if (blocked.has(`${row}-${column}`)) {
                    continue;
                }

                if (studentIndex >= orderedStudents.length) {
                    break;
                }

                const student = orderedStudents[studentIndex];

                assignments.push({
                    student,
                    room,
                    row,
                    column,
                    seatNumber:
                        `R${row}-C${column}`,
                    department:
                        student.department
                });

                assignedStudentIds.add(
                    String(student._id)
                );

                studentIndex++;
                roomSeatNumber++;
            }

            if (studentIndex >= orderedStudents.length) {
                break;
            }
        }

        if (studentIndex >= orderedStudents.length) {
            break;
        }
    }

    const unassignedStudents =
        orderedStudents.filter(
            student =>
                !assignedStudentIds.has(
                    String(student._id)
                )
        );

    const usedRoomIds =
        new Set(
            assignments.map(
                assignment =>
                    assignment.room._id
                        ? assignment.room._id.toString()
                        : String(
                            assignment.room.roomNumber
                        )
            )
        );

    const totalPhysicalSeats =
        orderedRooms.reduce(
            (total, room) =>
                total +
                (Number(room.rows) || 0) *
                (Number(room.columns) || 0),
            0
        );

    const totalSeats =
        orderedRooms.reduce(
            (total, room) => {
                const rows =
                    Number(room.rows) || 0;

                const columns =
                    Number(room.columns) || 0;

                let usable;
                if (columns >= 2) {
                    usable =
                        columns >= 6
                            ? 6
                            : columns >= 4
                                ? 4
                                : 2;
                } else {
                    usable = columns;
                }

                let roomTotal = rows * usable;

                const defectiveDesks = getRoomDefectiveDesks(room, roomConfigurations);
                if (defectiveDesks.length > 0) {
                    const blocked = getDefectiveSet(defectiveDesks);
                    const usableColumns = [];
                    if (columns >= 2) { usableColumns.push(1); usableColumns.push(3); }
                    if (columns >= 4) { usableColumns.push(4); usableColumns.push(6); }
                    if (columns >= 6) { usableColumns.push(7); usableColumns.push(9); }

                    let blockedCount = 0;
                    for (const col of usableColumns) {
                        for (let r = 1; r <= rows; r++) {
                            if (blocked.has(`${r}-${col}`)) {
                                blockedCount++;
                            }
                        }
                    }
                    roomTotal -= blockedCount;
                }

                return total + roomTotal;
            },
            0
        );

    return {
        assignments,
        unassignedStudents,
        totalStudents:
            orderedStudents.length,
        assignedStudents:
            assignments.length,
        unassignedCount:
            unassignedStudents.length,
        totalSeats,
        totalPhysicalSeats,
        usedRooms:
            usedRoomIds.size,
        totalRooms:
            orderedRooms.length
    };
};

module.exports = {
    generateSeatingPlan
};