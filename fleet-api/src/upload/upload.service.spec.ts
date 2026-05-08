import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UploadService } from './upload.service';
import { createClient } from '@supabase/supabase-js';
import { BadRequestException } from '@nestjs/common';

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

describe('UploadService', () => {
  let service: UploadService;
  let configService: ConfigService;
  let mockSupabase: any;

  beforeEach(async () => {
    mockSupabase = {
      storage: {
        from: jest.fn().mockReturnThis(),
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'SUPABASE_URL') return 'http://localhost:54321';
              if (key === 'SUPABASE_ANON_KEY') return 'anon-key';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should throw error if config is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      expect(() => new UploadService(configService)).toThrow(
        'SUPABASE_URL and SUPABASE_ANON_KEY must be defined in the configuration',
      );
    });
  });

  describe('uploadFile', () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      mimetype: 'image/png',
    } as Express.Multer.File;

    it('should upload a file and return public URL', async () => {
      mockSupabase.storage.upload.mockResolvedValue({ data: {}, error: null });
      mockSupabase.storage.getPublicUrl.mockReturnValue({
        data: { publicUrl: 'http://localhost/test.png' },
      });

      const result = await service.uploadFile(mockFile);

      expect(result).toBe('http://localhost/test.png');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('fleet-assets');
      expect(mockSupabase.storage.upload).toHaveBeenCalled();
    });

    it('should throw BadRequestException if upload fails', async () => {
      mockSupabase.storage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      });

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no file is provided', async () => {
      await expect(service.uploadFile(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
