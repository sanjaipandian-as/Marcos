import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { Role, AppointmentStatus, AppointmentType } from '@prisma/client';
import { getIO, initSocket } from '../src/socket/socket.handler.js';
import http from 'http';

describe('Appointments scheduling & cancellation rules', () => {
  let customer1: any;
  let customer2: any;
  let admin: any;
  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;
  let server: http.Server;

  beforeAll((done) => {
    server = http.createServer();
    initSocket(server);
    server.listen(done);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    customer1 = await prisma.user.create({
      data: { email: 'c1.appt@marcosapp.com', phoneNumber: '+919000000001', passwordHash: 'hash', fullName: 'Customer One', role: Role.CUSTOMER, referralCode: 'REF-C1' }
    });
    customer2 = await prisma.user.create({
      data: { email: 'c2.appt@marcosapp.com', phoneNumber: '+919000000002', passwordHash: 'hash', fullName: 'Customer Two', role: Role.CUSTOMER, referralCode: 'REF-C2' }
    });
    admin = await prisma.user.create({
      data: { email: 'admin.appt@marcosapp.com', phoneNumber: '+919000000003', passwordHash: 'hash', fullName: 'Admin Appt', role: Role.ADMIN, referralCode: 'REF-ADMIN' }
    });

    customer1Token = AuthService.generateAccessToken(customer1);
    customer2Token = AuthService.generateAccessToken(customer2);
    adminToken = AuthService.generateAccessToken(admin);
  });

  test('POST /appointments creates booking and blocks double-booking conflicts', async () => {
    const appointmentDate = new Date();
    appointmentDate.setHours(appointmentDate.getHours() + 24); // 24 hours from now
    const timeSlot = '10:00 - 11:00';

    // 1. First booking succeeds
    const res1 = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        date: appointmentDate.toISOString(),
        timeSlot,
        productType: 'Sherwani',
        type: 'MEASUREMENT',
        notes: 'Need wedding fit',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.success).toBe(true);
    expect(res1.body.data.timeSlot).toBe(timeSlot);

    // 2. Second booking for SAME date and time slot fails with 409 Conflict
    const resConflict = await request(app)
      .post('/api/v1/appointments')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({
        date: appointmentDate.toISOString(),
        timeSlot,
        productType: 'Lehenga',
        type: 'MEASUREMENT',
      });

    expect(resConflict.status).toBe(409);
    expect(resConflict.body.message).toContain('already booked');
  });

  test('GET /appointments enforces RBAC and filters', async () => {
    const date1 = new Date();
    date1.setHours(date1.getHours() + 10);
    const date2 = new Date();
    date2.setHours(date2.getHours() + 20);

    // Customer 1 booking
    await prisma.appointment.create({
      data: {
        userId: customer1.id,
        date: date1,
        timeSlot: '10:00 - 11:00',
        productType: 'Sherwani',
        type: 'MEASUREMENT',
        status: 'PENDING',
      }
    });

    // Customer 2 booking
    await prisma.appointment.create({
      data: {
        userId: customer2.id,
        date: date2,
        timeSlot: '12:00 - 13:00',
        productType: 'Suit',
        type: 'CONSULTATION',
        status: 'CONFIRMED',
      }
    });

    // Customer 1 gets appointments -> gets only their own (1)
    const resCust = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(resCust.status).toBe(200);
    expect(resCust.body.data.length).toBe(1);

    // Admin gets appointments -> gets all (2)
    const resAdmin = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.data.length).toBe(2);

    // Admin filters by status CONFIRMED -> returns 1
    const resFilter = await request(app)
      .get('/api/v1/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'CONFIRMED' });
    expect(resFilter.status).toBe(200);
    expect(resFilter.body.data.length).toBe(1);
  });

  test('PUT /appointments/:id enforces cancellation deadline (> 2 hours) and double-booking checks', async () => {
    const timeFuture = new Date();
    timeFuture.setHours(timeFuture.getHours() + 5); // 5 hours away

    const timeSoon = new Date();
    timeSoon.setHours(timeSoon.getHours() + 1); // 1 hour away (under 2 hours limit)

    const apptFuture = await prisma.appointment.create({
      data: {
        userId: customer1.id,
        date: timeFuture,
        timeSlot: '14:00 - 15:00',
        productType: 'Sherwani',
        type: 'MEASUREMENT',
        status: 'PENDING',
      }
    });

    const apptSoon = await prisma.appointment.create({
      data: {
        userId: customer1.id,
        date: timeSoon,
        timeSlot: '16:00 - 17:00',
        productType: 'Sherwani',
        type: 'MEASUREMENT',
        status: 'PENDING',
      }
    });

    // 1. Cancel booking that is 5 hours away -> should succeed
    const resCancelFuture = await request(app)
      .put(`/api/v1/appointments/${apptFuture.id}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ status: 'CANCELLED' });
    expect(resCancelFuture.status).toBe(200);
    expect(resCancelFuture.body.data.status).toBe('CANCELLED');

    // 2. Cancel booking that is 1 hour away -> should fail with 400 Bad Request
    const resCancelSoon = await request(app)
      .put(`/api/v1/appointments/${apptSoon.id}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ status: 'CANCELLED' });
    expect(resCancelSoon.status).toBe(400);
    expect(resCancelSoon.body.message).toContain('Cancellations are not permitted less than 2 hours');

    // 3. Reschedule with conflict -> should fail
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 10);

    // Create a confirmed appt at target slot
    await prisma.appointment.create({
      data: {
        userId: customer2.id,
        date: targetDate,
        timeSlot: '11:00 - 12:00',
        productType: 'Blazer',
        type: 'MEASUREMENT',
        status: 'CONFIRMED',
      }
    });

    // Try to reschedule apptSoon to conflict slot
    const resRescheduleConflict = await request(app)
      .put(`/api/v1/appointments/${apptSoon.id}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        date: targetDate.toISOString(),
        timeSlot: '11:00 - 12:00',
      });
    expect(resRescheduleConflict.status).toBe(409);
    expect(resRescheduleConflict.body.message).toContain('Slot conflict');
  });
});
