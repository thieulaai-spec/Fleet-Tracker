import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;

  // Use seeded users found in DB
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials);
      
      if (response.status !== 200) {
        console.log('Login failed body:', response.body);
      }
      
      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(adminCredentials.email);

      // Check cookies
      const cookies = response.get('Set-Cookie') as string[];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('access_token'))).toBeTruthy();
      expect(cookies.some(c => c.includes('refresh_token'))).toBeTruthy();
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'admin@fleettracker.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return user info only for web client type', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .set('x-client-type', 'web')
        .send(adminCredentials)
        .expect(200);

      expect(response.body).not.toHaveProperty('accessToken');
      expect(response.body).not.toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return profile info for authenticated user', async () => {
      // Login first
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const token = loginRes.body.accessToken;

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(adminCredentials.email);
    });

    it('should return profile info using cookies', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const cookies = loginRes.get('Set-Cookie') || [];

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.email).toBe(adminCredentials.email);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('/auth/register (POST)', () => {
    const timestamp = Date.now();
    const newUser = {
      email: `testuser_${timestamp}@example.com`,
      password: 'Password@123',
      role: 'driver',
    };

    it('should allow admin to register a new user', async () => {
      // Login as admin
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const token = loginRes.body.accessToken;

      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send(newUser)
        .expect(201);
    });

    it('should not allow driver to register a new user', async () => {
      // Login as the newly created driver from the previous test
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        });
      
      if (loginRes.status !== 200) {
        console.log('Driver login failed body:', loginRes.body);
      }
      
      expect(loginRes.status).toBe(200);

      const token = loginRes.body.accessToken;

      await request(app.getHttpServer())
        .post('/auth/register')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          email: 'another@example.com',
          password: 'Password@123',
          role: 'driver'
        })
        .expect(403); // Forbidden
    });
  });

  describe('/auth/refresh (POST)', () => {
    it('should refresh tokens using refresh token in body', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const refreshToken = loginRes.body.refreshToken;

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should refresh tokens using refresh token in cookie', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const cookies = loginRes.get('Set-Cookie') || [];

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', cookies)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('user');
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully and clear cookies', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminCredentials)
        .expect(200);

      const cookies = loginRes.get('Set-Cookie') || [];
      const token = loginRes.body.accessToken;

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect(200);

      const setCookies = response.get('Set-Cookie') as string[];
      expect(setCookies).toBeDefined();
      expect(setCookies.some(c => c.includes('access_token=;'))).toBeTruthy();
      expect(setCookies.some(c => c.includes('refresh_token=;'))).toBeTruthy();
    });
  });
});
