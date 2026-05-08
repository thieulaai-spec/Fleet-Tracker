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

  it('should throw error if token is missing', async () => {
    mockConfigService.get.mockReturnValue(null);
    const serviceNoToken = new RouteService(mockConfigService);
    await expect(
      serviceNoToken.getOptimalRoute([
        { lat: 10, lng: 106 },
        { lat: 11, lng: 107 },
      ]),
    ).rejects.toThrow('MAPBOX_ACCESS_TOKEN is not configured');
  });

  it('should throw error if Mapbox returns non-Ok code', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { code: 'InvalidInput', message: 'Waypoints are too far' },
    });
    await expect(
      routeService.getOptimalRoute([
        { lat: 10, lng: 106 },
        { lat: 11, lng: 107 },
      ]),
    ).rejects.toThrow('Mapbox API error: Waypoints are too far');
  });

  it('should log and re-throw on axios failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network Error'));
    await expect(
      routeService.getOptimalRoute([
        { lat: 10, lng: 106 },
        { lat: 11, lng: 107 },
      ]),
    ).rejects.toThrow('Network Error');
  });

  it('should re-calculate route using reRoute helper', async () => {
    const mockResponse = {
      data: {
        code: 'Ok',
        routes: [{ geometry: {}, distance: 10, duration: 10 }],
        waypoints: [],
      },
    };
    mockedAxios.get.mockResolvedValue(mockResponse);

    const result = await routeService.reRoute(
      { lat: 10, lng: 106 },
      { lat: 11, lng: 107 },
    );
    expect(result.distance).toBe(10);
  });
});
