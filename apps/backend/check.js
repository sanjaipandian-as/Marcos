const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.appointment.findMany({where: {orderId: {not: null}}}).then(console.log).finally(()=>p.$disconnect());
