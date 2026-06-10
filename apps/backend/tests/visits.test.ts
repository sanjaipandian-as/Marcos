import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { Role, VisitStatus } from '@prisma/client';
import http from 'http';
import { initSocket } from '../src/socket/socket.handler.js';

describe('Store Visits operations & file validation', () => {
  let customerToken: string;
  let adminToken: string;
  let staffToken: string;
  let otherStaffToken: string;

  let customer: any;
  let admin: any;
  let staff: any;
  let otherStaff: any;
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
    customer = await prisma.user.create({
      data: { email: 'c.visit@marcosapp.com', phoneNumber: '+918000000001', passwordHash: 'hash', fullName: 'Cust Visit', role: Role.CUSTOMER, referralCode: 'REF-CV' }
    });
    admin = await prisma.user.create({
      data: { email: 'a.visit@marcosapp.com', phoneNumber: '+918000000002', passwordHash: 'hash', fullName: 'Admin Visit', role: Role.ADMIN, referralCode: 'REF-AV' }
    });
    staff = await prisma.user.create({
      data: { email: 's.visit@marcosapp.com', phoneNumber: '+918000000003', passwordHash: 'hash', fullName: 'Staff Visit', role: Role.STAFF, referralCode: 'REF-SV' }
    });
    otherStaff = await prisma.user.create({
      data: { email: 'os.visit@marcosapp.com', phoneNumber: '+918000000004', passwordHash: 'hash', fullName: 'Other Staff', role: Role.STAFF, referralCode: 'REF-OSV' }
    });

    customerToken = AuthService.generateAccessToken(customer);
    adminToken = AuthService.generateAccessToken(admin);
    staffToken = AuthService.generateAccessToken(staff);
    otherStaffToken = AuthService.generateAccessToken(otherStaff);
  });

  test('POST /visits creates visit request, and PUT /visits/:id/assign schedules it', async () => {
    // 1. Customer creates visit request
    const preferredDate = new Date();
    preferredDate.setDate(preferredDate.getDate() + 5);

    const resCreate = await request(app)
      .post('/api/v1/visits')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        preferredDate: preferredDate.toISOString(),
        address: '123 Tailor Street',
        requirements: 'Need measurements for bridal lehenga',
      });

    expect(resCreate.status).toBe(201);
    expect(resCreate.body.success).toBe(true);
    expect(resCreate.body.data.status).toBe('PENDING');

    const visitId = resCreate.body.data.id;

    // 2. Customer attempts to assign -> 403 Forbidden
    const resCustAssign = await request(app)
      .put(`/api/v1/visits/${visitId}/assign`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ assignedStaffId: staff.id, confirmedDate: new Date().toISOString() });
    expect(resCustAssign.status).toBe(403);

    // 3. Admin assigns staff -> 200 OK
    const confirmedDate = new Date();
    confirmedDate.setDate(confirmedDate.getDate() + 5);

    const resAssign = await request(app)
      .put(`/api/v1/visits/${visitId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        assignedStaffId: staff.id,
        confirmedDate: confirmedDate.toISOString(),
      });

    expect(resAssign.status).toBe(200);
    expect(resAssign.body.data.status).toBe('ASSIGNED');
    expect(resAssign.body.data.assignedStaffId).toBe(staff.id);
  });

  test('PUT /visits/:id/status updates status and performs signature checks', async () => {
    // 1. Create a visit assigned to Staff
    const visit = await prisma.storeVisit.create({
      data: {
        customerId: customer.id,
        assignedStaffId: staff.id,
        preferredDate: new Date(),
        confirmedDate: new Date(),
        address: '123 Tailor Street',
        requirements: 'Lehenga fit',
        status: VisitStatus.ASSIGNED,
      }
    });

    // 2. Unassigned staff attempts to update -> 403 Forbidden
    const resOtherStaff = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${otherStaffToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(resOtherStaff.status).toBe(403);

    // 3. Assigned staff updates to IN_PROGRESS -> 200 OK
    const resProgress = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });
    expect(resProgress.status).toBe(200);
    expect(resProgress.body.data.status).toBe('IN_PROGRESS');

    // 4. Assigned staff attempts completion WITHOUT notes -> 400 Bad Request
    const resNoNotes = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'COMPLETED' });
    expect(resNoNotes.status).toBe(400);

    // 5. Image upload signature checks (binary analysis)
    // Setup file buffers
    const validJpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const invalidBuffer = Buffer.from('this is not an image binary');
    const pdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // PDF is valid mime but blocked by visits route limit of allowedTypes [jpeg, png]

    // Upload invalid signature -> 400 Bad Request
    const resInvalidSign = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'COMPLETED')
      .field('completionNotes', 'Fit completed.')
      .attach('images', invalidBuffer, 'photo.jpg');
    expect(resInvalidSign.status).toBe(400);
    expect(resInvalidSign.body.message).toContain('invalid file signature');

    // Upload PDF signature -> 400 Bad Request (not allowed in route)
    const resPdfSign = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'COMPLETED')
      .field('completionNotes', 'Fit completed.')
      .attach('images', pdfBuffer, 'report.pdf');
    expect(resPdfSign.status).toBe(400);

    // Upload too large file (6MB) -> 400 Bad Request
    const largeJpegBuffer = Buffer.concat([validJpegBuffer, Buffer.alloc(6 * 1024 * 1024)]);
    const resLarge = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'COMPLETED')
      .field('completionNotes', 'Fit completed.')
      .attach('images', largeJpegBuffer, 'large.jpg');
    expect(resLarge.status).toBe(400);
    expect(resLarge.body.message).toContain('exceeds the maximum size limit');

    // Upload valid JPEG -> 200 OK
    const resComplete = await request(app)
      .put(`/api/v1/visits/${visit.id}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .field('status', 'COMPLETED')
      .field('completionNotes', 'Completed fitting fabric measurements.')
      .attach('images', validJpegBuffer, 'fit.jpg')
      .attach('images', validPngBuffer, 'fit.png');

    expect(resComplete.status).toBe(200);
    expect(resComplete.body.data.status).toBe('COMPLETED');

    // Assert VisitReport is created
    const report = await prisma.visitReport.findUnique({ where: { visitId: visit.id } });
    expect(report).toBeTruthy();
    expect(report?.staffId).toBe(staff.id);
    expect(report?.mediaUrls.length).toBe(2);
  });
});
