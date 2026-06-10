import prisma from '../config/db.js';

interface AuditLogOptions {
  userId?: string | null;
  action: string;
  details: Record<string, any> & { message: string };
  ipAddress?: string | null;
}

export async function createAuditLog({ userId, action, details, ipAddress }: AuditLogOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        details,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err: any) {
    console.error(`Failed to write audit log for action ${action}:`, err.message);
  }
}
