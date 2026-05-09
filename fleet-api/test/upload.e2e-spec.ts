import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UploadController } from '../src/upload/upload.controller';
import { UploadService } from '../src/upload/upload.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('UploadController (e2e)', () => {
  let app: INestApplication;

  const mockUploadService = {
    uploadFile: jest.fn().mockResolvedValue('https://storage.supabase.co/test/image.png'),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [{ provide: UploadService, useValue: mockUploadService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = { id: 'u1' }; return true; } })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('POST /upload - should upload a file', async () => {
    const res = await request(app.getHttpServer())
      .post('/upload?folder=vehicles')
      .attach('file', Buffer.from('fake-image'), {
        filename: 'test.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(res.body.url).toBe('https://storage.supabase.co/test/image.png');
    expect(mockUploadService.uploadFile).toHaveBeenCalled();
  });

  it('POST /upload - should reject non-image files', async () => {
    await request(app.getHttpServer())
      .post('/upload')
      .attach('file', Buffer.from('fake-doc'), {
        filename: 'test.pdf',
        contentType: 'application/pdf',
      })
      .expect(400);
  });
});
