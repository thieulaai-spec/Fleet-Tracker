import { Test, TestingModule } from '@nestjs/testing';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';
import { TrackingGateway } from './tracking.gateway';
import { ConfigService } from '@nestjs/config';

describe('TrackingController', () => {
  let controller: TrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TrackingController],
      providers: [
        {
          provide: TrackingService,
          useValue: {
            processGpsUpdate: jest.fn(),
            getVehicleHistory: jest.fn(),
            getLiveLocations: jest.fn(),
          },
        },
        {
          provide: TrackingGateway,
          useValue: {
            server: {
              to: jest.fn().mockReturnThis(),
              emit: jest.fn(),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-api-key'),
          },
        },
      ],
    }).compile();

    controller = module.get<TrackingController>(TrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
