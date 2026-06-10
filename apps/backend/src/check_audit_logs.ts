import prisma from './config/db.js';

async function checkAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    console.log('--- RECENT AUDIT LOGS ---');
    console.log(JSON.stringify(logs, null, 2));
    console.log('-------------------------');
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();
