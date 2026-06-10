import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { Role } from '@prisma/client';

describe('Measurement Module Permissions & Audit Histories', () => {
  let customer1Token: string;
  let customer2Token: string;
  let adminToken: string;
  let staffToken: string;

  let customer1: any;
  let customer2: any;
  let adminUser: any;
  let staffUser: any;

  beforeEach(async () => {
    // Setup users
    customer1 = await prisma.user.create({
      data: { email: 'cust1@marcosapp.com', phoneNumber: '+1234567890', passwordHash: 'hash', fullName: 'Cust One', role: Role.CUSTOMER, referralCode: 'CUST1' }
    });
    customer2 = await prisma.user.create({
      data: { email: 'cust2@marcosapp.com', phoneNumber: '+1234567891', passwordHash: 'hash', fullName: 'Cust Two', role: Role.CUSTOMER, referralCode: 'CUST2' }
    });
    adminUser = await prisma.user.create({
      data: { email: 'admin@marcosapp.com', phoneNumber: '+1234567892', passwordHash: 'hash', fullName: 'Admin User', role: Role.ADMIN, referralCode: 'ADMIN1' }
    });
    staffUser = await prisma.user.create({
      data: { email: 'staff@marcosapp.com', phoneNumber: '+1234567893', passwordHash: 'hash', fullName: 'Staff User', role: Role.STAFF, referralCode: 'STAFF1' }
    });

    customer1Token = AuthService.generateAccessToken(customer1);
    customer2Token = AuthService.generateAccessToken(customer2);
    adminToken = AuthService.generateAccessToken(adminUser);
    staffToken = AuthService.generateAccessToken(staffUser);
  });

  test('GET /measurements should enforce ownership or role checks', async () => {
    // 1. Create a measurement profile for Customer 1
    const profile = await prisma.measurementProfile.create({
      data: {
        userId: customer1.id,
        profileName: 'Self',
        waist: 28.5,
        hip: 34.0,
      }
    });

    // Customer 1 fetches own -> 200 OK
    const resOwn = await request(app)
      .get('/api/v1/measurements')
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(resOwn.status).toBe(200);
    expect(resOwn.body.data.length).toBe(1);
    expect(resOwn.body.data[0].profileName).toBe('Self');

    // Customer 2 fetches without privileges -> Customer 2 gets only their own empty list
    const resOther = await request(app)
      .get('/api/v1/measurements')
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(resOther.status).toBe(200);
    expect(resOther.body.data.length).toBe(0);

    // Staff fetches customer 1 profile by specifying query parameter
    const resStaff = await request(app)
      .get(`/api/v1/measurements?userId=${customer1.id}`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(resStaff.status).toBe(200);
    expect(resStaff.body.data[0].profileName).toBe('Self');

    // Admin fetches all profiles in database
    const resAdminAll = await request(app)
      .get('/api/v1/measurements')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(resAdminAll.status).toBe(200);
    expect(resAdminAll.body.data.length).toBe(1);
  });

  test('POST /measurements should create measurement profiles', async () => {
    // Customer 1 creates self profile
    const resCreate = await request(app)
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({
        profileName: 'Mother',
        waist: 32.0,
        hip: 38.0,
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.success).toBe(true);
    expect(resCreate.body.data.profileName).toBe('Mother');

    // Staff creates profile for Customer 1
    const resStaffCreate = await request(app)
      .post('/api/v1/measurements')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        userId: customer1.id,
        profileName: 'Sister',
        waist: 26.0,
      });

    expect(resStaffCreate.status).toBe(201);
    expect(resStaffCreate.body.data.userId).toBe(customer1.id);
  });

  test('PUT /measurements/:id updates dimensions, saves history and records audit log', async () => {
    const profile = await prisma.measurementProfile.create({
      data: {
        userId: customer1.id,
        profileName: 'Self',
        waist: 28.5,
        hip: 34.0,
      }
    });

    // Customer attempts update -> 403 Forbidden (RBAC blocks it since PUT requires Role.ADMIN, Role.SUPERADMIN, or Role.STAFF)
    const resCustUpdate = await request(app)
      .put(`/api/v1/measurements/${profile.id}`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ waist: 30.0 });
    expect(resCustUpdate.status).toBe(403);

    // Verify AuditLog contains UNAUTHORIZED_ACCESS_ATTEMPT record
    const breachAudit = await prisma.auditLog.findFirst({
      where: { action: 'UNAUTHORIZED_ACCESS_ATTEMPT' }
    });
    expect(breachAudit).toBeTruthy();
    expect((breachAudit?.details as any).userId).toBe(customer1.id);

    // Staff updates -> 200 OK
    const resStaffUpdate = await request(app)
      .put(`/api/v1/measurements/${profile.id}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ waist: 30.0, hip: 35.5 });
    
    expect(resStaffUpdate.status).toBe(200);
    expect(Number(resStaffUpdate.body.data.waist)).toBe(30.0);

    // Check MeasurementHistory contains snapshot
    const history = await prisma.measurementHistory.findMany({
      where: { profileId: profile.id }
    });
    expect(history.length).toBe(1);
    expect(history[0].changedBy).toBe(staffUser.id);
    expect(Number((history[0].previousValues as any).waist)).toBe(28.5);
    expect(Number((history[0].newValues as any).waist)).toBe(30);

    // Check AuditLog entry
    const audit = await prisma.auditLog.findFirst({
      where: { action: 'UPDATE_MEASUREMENT' }
    });
    expect(audit).toBeTruthy();
    expect(audit?.userId).toBe(staffUser.id);

    // GET /measurements/:id/history should be accessible by Staff
    const resHistory = await request(app)
      .get(`/api/v1/measurements/${profile.id}/history`)
      .set('Authorization', `Bearer ${staffToken}`);
    expect(resHistory.status).toBe(200);
    expect(resHistory.body.data.length).toBe(1);

    // GET /measurements/:id/history should be forbidden for Customer
    const resCustHistory = await request(app)
      .get(`/api/v1/measurements/${profile.id}/history`)
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(resCustHistory.status).toBe(403);
  });

  test('DELETE /measurements/:id enforces ownership and cascade deletes history', async () => {
    const profile = await prisma.measurementProfile.create({
      data: {
        userId: customer1.id,
        profileName: 'Delete Me',
      }
    });

    // Create a mock history entry
    await prisma.measurementHistory.create({
      data: {
        profileId: profile.id,
        changedBy: staffUser.id,
        previousValues: {},
        newValues: {},
      }
    });

    // Customer 2 attempts to delete Customer 1's profile -> 403 Forbidden
    const resOtherDelete = await request(app)
      .delete(`/api/v1/measurements/${profile.id}`)
      .set('Authorization', `Bearer ${customer2Token}`);
    expect(resOtherDelete.status).toBe(403);

    // Customer 1 deletes own profile -> 200 OK
    const resOwnDelete = await request(app)
      .delete(`/api/v1/measurements/${profile.id}`)
      .set('Authorization', `Bearer ${customer1Token}`);
    expect(resOwnDelete.status).toBe(200);

    // Verify profile is deleted
    const deletedProfile = await prisma.measurementProfile.findUnique({ where: { id: profile.id } });
    expect(deletedProfile).toBeNull();

    // Verify history cascade deleted
    const historyCount = await prisma.measurementHistory.count({ where: { profileId: profile.id } });
    expect(historyCount).toBe(0);

    // Verify AuditLog written
    const deleteAudit = await prisma.auditLog.findFirst({ where: { action: 'DELETE_MEASUREMENT_PROFILE' } });
    expect(deleteAudit).toBeTruthy();
    expect((deleteAudit?.details as any).profileName).toBe('Delete Me');
  });
});
