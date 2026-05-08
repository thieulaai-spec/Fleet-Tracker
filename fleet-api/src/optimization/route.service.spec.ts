import { RouteService } from './route.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RouteService Logic', () => {
  let routeService: RouteService;
  let mockConfigService: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('fake-token'),
    };
    routeService = new RouteService(mockConfigService);
  });

  it('should return valid GeoJSON route from Mapbox API', async () => {
    const mockResponse = {
      data: {
        code: 'Ok',
        routes: [
          {
            geometry: {
              type: 'LineString',
              coordinates: [
                [106, 10],
                [106.1, 10.1],
              ],
            },
            distance: 15000,
            duration: 1800,
          },
        ],
        waypoints: [],
      },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    const waypoints = [
      { lat: 10, lng: 106 },
      { lat: 10.1, lng: 106.1 },
    ];
    const result = await routeService.getOptimalRoute(waypoints);

    expect(mockedAxios.get).toHaveBeenCalled();
    expect(result.geometry.type).toBe('LineString');
    expect(result.distance).toBe(15000);
    expect(result.duration).toBe(1800);
  });

  it('should throw error if less than 2 waypoints', async () => {
    await expect(
      routeService.getOptimalRoute([{ lat: 10, lng: 106 }]),
    ).rejects.toThrow('At least 2 waypoints are required');
  });
});
