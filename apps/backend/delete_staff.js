import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.user.findMany({
    where: {
      role: {
        in: ['ADMIN', 'STAFF']
      }
    }
  });

  const staffIds = staff.map(s => s.id);

  if (staffIds.length === 0) {
    console.log("No staff found to delete.");
    return;
  }

  // Delete VisitReports created by these staff
  await prisma.visitReport.deleteMany({
    where: { staffId: { in: staffIds } }
  });

  // Unassign from StoreVisits
  await prisma.storeVisit.updateMany({
    where: { assignedStaffId: { in: staffIds } },
    data: { assignedStaffId: null }
  });

  // Now delete the users
  const result = await prisma.user.deleteMany({
    where: { id: { in: staffIds } }
  });

  console.log(`Deleted ${result.count} ADMIN/STAFF users.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
