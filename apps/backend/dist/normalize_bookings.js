"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Starting existing bookings invoice number normalization...');
    // Regex to extract invoice number (e.g. INV-1718712398403-E5F6A901)
    const invoiceRegex = /INV-\d+-[A-Z0-9]+/i;
    // 1. Normalize Appointments
    const appointments = await prisma.appointment.findMany({
        where: {
            notes: { not: null }
        }
    });
    let apptCount = 0;
    for (const appt of appointments) {
        if (!appt.notes)
            continue;
        const match = appt.notes.match(invoiceRegex);
        if (match) {
            const cleanInvoice = match[0].toUpperCase();
            console.log(`Updating Appointment ${appt.id}: "${appt.notes}" -> "${cleanInvoice}"`);
            await prisma.appointment.update({
                where: { id: appt.id },
                data: { notes: cleanInvoice }
            });
            apptCount++;
        }
    }
    console.log(`✓ Normalized ${apptCount} appointments.`);
    // 2. Normalize StoreVisits
    const visits = await prisma.storeVisit.findMany({});
    let visitCount = 0;
    for (const visit of visits) {
        if (!visit.requirements)
            continue;
        const match = visit.requirements.match(invoiceRegex);
        if (match) {
            const cleanInvoice = match[0].toUpperCase();
            console.log(`Updating StoreVisit ${visit.id}: "${visit.requirements}" -> "${cleanInvoice}"`);
            await prisma.storeVisit.update({
                where: { id: visit.id },
                data: { requirements: cleanInvoice }
            });
            visitCount++;
        }
    }
    console.log(`✓ Normalized ${visitCount} store visits.`);
    console.log('🎉 Normalization migration complete!');
}
main()
    .catch(console.error)
    .finally(async () => {
    await prisma.$disconnect();
});
