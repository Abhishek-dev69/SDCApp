import { BATCHES } from './studentBatches';

const BATCH_ADMIN_DETAILS = {
  A1: { studentCount: 42, capacity: 48, attendance: 91, testAverage: 82, feePerStudent: 52000, collectedAmount: 1840000, dueStudents: 6, overdueStudents: 2 },
  A2: { studentCount: 38, capacity: 44, attendance: 88, testAverage: 79, feePerStudent: 58000, collectedAmount: 1940000, dueStudents: 5, overdueStudents: 1 },
  A3: { studentCount: 40, capacity: 48, attendance: 84, testAverage: 74, feePerStudent: 52000, collectedAmount: 1690000, dueStudents: 8, overdueStudents: 3 },
  G1: { studentCount: 44, capacity: 50, attendance: 92, testAverage: 84, feePerStudent: 68000, collectedAmount: 2580000, dueStudents: 6, overdueStudents: 1 },
  K1: { studentCount: 36, capacity: 42, attendance: 87, testAverage: 77, feePerStudent: 50000, collectedAmount: 1510000, dueStudents: 7, overdueStudents: 2 },
  K2: { studentCount: 45, capacity: 52, attendance: 90, testAverage: 85, feePerStudent: 72000, collectedAmount: 2870000, dueStudents: 5, overdueStudents: 1 },
  K3: { studentCount: 32, capacity: 42, attendance: 82, testAverage: 71, feePerStudent: 50000, collectedAmount: 1210000, dueStudents: 9, overdueStudents: 4 },
  S1: { studentCount: 35, capacity: 42, attendance: 89, testAverage: 78, feePerStudent: 48000, collectedAmount: 1430000, dueStudents: 5, overdueStudents: 1 },
  S2: { studentCount: 34, capacity: 40, attendance: 86, testAverage: 76, feePerStudent: 56000, collectedAmount: 1520000, dueStudents: 8, overdueStudents: 3 },
  S3: { studentCount: 41, capacity: 48, attendance: 91, testAverage: 81, feePerStudent: 64000, collectedAmount: 2210000, dueStudents: 6, overdueStudents: 2 },
};

const DUE_STUDENTS = [
  { id: 'due-a1-1', name: 'Aarav Mehta', batchId: 'A1', amount: 26000, dueDate: '12 May', status: 'Installment due' },
  { id: 'due-a2-1', name: 'Riya Shah', batchId: 'A2', amount: 29000, dueDate: '14 May', status: 'Reminder sent' },
  { id: 'due-a3-1', name: 'Kabir Singh', batchId: 'A3', amount: 52000, dueDate: '10 May', status: 'Overdue' },
  { id: 'due-g1-1', name: 'Ishita Sharma', batchId: 'G1', amount: 34000, dueDate: '18 May', status: 'Installment due' },
  { id: 'due-k2-1', name: 'Manasvi Gawli', batchId: 'K2', amount: 36000, dueDate: '20 May', status: 'Reminder sent' },
  { id: 'due-k3-1', name: 'Dev Patel', batchId: 'K3', amount: 50000, dueDate: '09 May', status: 'Overdue' },
  { id: 'due-s2-1', name: 'Anaya Rao', batchId: 'S2', amount: 28000, dueDate: '16 May', status: 'Installment due' },
];

function formatIndianNumber(value) {
  const roundedValue = Math.round(value);
  const number = `${Math.abs(roundedValue)}`;
  const lastThree = number.slice(-3);
  const remaining = number.slice(0, -3);
  const formattedRemaining = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const sign = roundedValue < 0 ? '-' : '';

  return `${sign}${formattedRemaining ? `${formattedRemaining},` : ''}${lastThree}`;
}

export function formatCurrency(amount) {
  const absoluteAmount = Math.abs(amount);

  if (absoluteAmount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`;
  }

  if (absoluteAmount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`;
  }

  return `₹${formatIndianNumber(amount)}`;
}

export const ADMIN_BATCH_OVERVIEW = BATCHES.map((batch) => {
  const details = BATCH_ADMIN_DETAILS[batch.id];
  const expectedAmount = details.studentCount * details.feePerStudent;
  const pendingAmount = Math.max(expectedAmount - details.collectedAmount, 0);

  return {
    ...batch,
    name: `${batch.label} Batch`,
    studentCount: details.studentCount,
    capacity: details.capacity,
    attendance: details.attendance,
    testAverage: details.testAverage,
    feePerStudent: details.feePerStudent,
    collectedAmount: details.collectedAmount,
    expectedAmount,
    pendingAmount,
    dueStudents: details.dueStudents,
    overdueStudents: details.overdueStudents,
    occupancyRate: Math.round((details.studentCount / details.capacity) * 100),
    collectionRate: Math.round((details.collectedAmount / expectedAmount) * 100),
  };
});

export const ADMIN_DUE_STUDENTS = DUE_STUDENTS.map((student) => {
  const batch = ADMIN_BATCH_OVERVIEW.find((item) => item.id === student.batchId);

  return {
    ...student,
    batchName: batch?.name || student.batchId,
    branch: batch?.branch || '',
    stream: batch?.stream || '',
    program: batch?.program || '',
  };
});

export function getAdminBatchTotals() {
  const totalStudents = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.studentCount, 0);
  const totalCapacity = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.capacity, 0);
  const expectedAmount = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.expectedAmount, 0);
  const collectedAmount = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.collectedAmount, 0);
  const pendingAmount = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.pendingAmount, 0);
  const dueStudents = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.dueStudents, 0);
  const overdueStudents = ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.overdueStudents, 0);
  const averageAttendance = Math.round(
    ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.attendance, 0) / ADMIN_BATCH_OVERVIEW.length
  );
  const averageScore = Math.round(
    ADMIN_BATCH_OVERVIEW.reduce((sum, batch) => sum + batch.testAverage, 0) / ADMIN_BATCH_OVERVIEW.length
  );

  return {
    activeBatches: ADMIN_BATCH_OVERVIEW.length,
    totalStudents,
    totalCapacity,
    expectedAmount,
    collectedAmount,
    pendingAmount,
    dueStudents,
    overdueStudents,
    averageAttendance,
    averageScore,
    occupancyRate: Math.round((totalStudents / totalCapacity) * 100),
    collectionRate: Math.round((collectedAmount / expectedAmount) * 100),
  };
}

export function getBranchSummaries() {
  const branchMap = ADMIN_BATCH_OVERVIEW.reduce((branches, batch) => {
    const currentBranch = branches[batch.branch] || {
      id: batch.branch,
      branch: batch.branch,
      batches: 0,
      students: 0,
      capacity: 0,
      attendanceTotal: 0,
      scoreTotal: 0,
      pendingAmount: 0,
    };

    currentBranch.batches += 1;
    currentBranch.students += batch.studentCount;
    currentBranch.capacity += batch.capacity;
    currentBranch.attendanceTotal += batch.attendance;
    currentBranch.scoreTotal += batch.testAverage;
    currentBranch.pendingAmount += batch.pendingAmount;

    return {
      ...branches,
      [batch.branch]: currentBranch,
    };
  }, {});

  return Object.values(branchMap).map((branch) => ({
    ...branch,
    attendance: Math.round(branch.attendanceTotal / branch.batches),
    testAverage: Math.round(branch.scoreTotal / branch.batches),
    occupancyRate: Math.round((branch.students / branch.capacity) * 100),
  }));
}
