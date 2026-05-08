import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { OrderStatus } from '../src/entities/order.entity';

describe('OrdersModule (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let driverToken: string;

  const adminCredentials = {
    email: 'admin@fleettracker.com',
    password: 'Admin@123',
  };

  const driverCredentials = {
    email: 'driver1@fleettracker.com',
    password: 'Driver@123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Login as Admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send(adminCredentials);
    adminToken = adminLogin.body.accessToken;

    // Create a new driver for RBAC testing
    const timestamp = Date.now();
    const testDriver = {
      email: `driver_${timestamp}@example.com`,
      password: 'Password@123',
      role: 'driver',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testDriver)
      .expect(201);

    // Login as Driver
    const driverLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testDriver.email,
        password: testDriver.password,
      });
    
    if (driverLogin.status !== 200) {
      console.log('Driver login failed:', driverLogin.body);
    }
    driverToken = driverLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  let createdOrderId: string;

  describe('/orders (POST)', () => {
    const createOrderDto = {
      pickupAddress: '123 Test Pickup St',
      pickupLat: 10.762622,
      pickupLng: 106.660172,
      deliveryAddress: '456 Test Delivery Rd',
      deliveryLat: 10.823099,
      deliveryLng: 106.629664,
      weightKg: 100,
      description: 'E2E Test Order',
    };

    it('should create a new order (Admin)', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe(OrderStatus.PENDING);
      createdOrderId = response.body.id;
    });

    it('should fail to create a new order (Driver - RBAC)', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(createOrderDto)
        .expect(403);
    });
  });

  describe('/orders (GET)', () => {
    it('should list all orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBeTruthy();
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should find pending orders', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.every(o => o.status === OrderStatus.PENDING)).toBeTruthy();
    });
  });

  describe('/orders/:id (GET)', () => {
    it('should get order details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.id).toBe(createdOrderId);
      expect(response.body.description).toBe('E2E Test Order');
    });

    it('should return 404 for non-existent order', async () => {
      await request(app.getHttpServer())
        .get('/orders/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('/orders/:id (PATCH)', () => {
    it('should update order details (Admin)', async () => {
      const updateDto = {
        weightKg: 200,
        description: 'Updated E2E Test Order',
      };

      const response = await request(app.getHttpServer())
        .patch(`/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto)
        .expect(200);

      expect(Number(response.body.weightKg)).toBe(200);
      expect(response.body.description).toBe('Updated E2E Test Order');
    });

    it('should fail to update order details (Driver - RBAC)', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ weightKg: 300 })
        .expect(403);
    });
  });

  describe('/orders/:id/status (PATCH)', () => {
    it('should update order status (Admin)', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/orders/${createdOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: OrderStatus.ASSIGNED })
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.ASSIGNED);
    });
  });

  describe('/orders/:id (DELETE)', () => {
    it('should fail to delete if not in PENDING status', async () => {
      // Current status is ASSIGNED from previous test
      await request(app.getHttpServer())
        .delete(`/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should delete order if in PENDING status', async () => {
      // Create another one
      const createRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pickupAddress: 'Delete Me',
          pickupLat: 0,
          pickupLng: 0,
          deliveryAddress: 'Nowhere',
          deliveryLat: 0,
          deliveryLng: 0,
          weightKg: 1,
        })
        .expect(201);

      const orderToDelete = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/orders/${orderToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/orders/${orderToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
