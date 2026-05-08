import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BadRequestException } from '@nestjs/common';

describe('UploadController', () => {
  let controller: UploadController;
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue('http://localhost/test.png'),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<UploadController>(UploadController);
    service = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should call service.uploadFile and return URL', async () => {
      const mockFile = {
        originalname: 'test.png',
        buffer: Buffer.from('test'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      const result = await controller.uploadFile(mockFile, 'test-folder');

      expect(service.uploadFile).toHaveBeenCalledWith(mockFile, 'test-folder');
      expect(result).toEqual({ url: 'http://localhost/test.png' });
    });
  });
});
