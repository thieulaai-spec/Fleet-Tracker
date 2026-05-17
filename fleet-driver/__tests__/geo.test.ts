import { parsePoint } from '../utils/geo';

describe('parsePoint', () => {
  it('should parse standard GeoJSON object correctly', () => {
    const geoJson = { type: 'Point', coordinates: [106.6353, 10.7838] };
    const result = parsePoint(geoJson);
    expect(result).toEqual({ latitude: 10.7838, longitude: 106.6353 });
  });

  it('should parse direct latitude/longitude object correctly', () => {
    const directObj = { latitude: 10.7838, longitude: 106.6353 };
    const result = parsePoint(directObj);
    expect(result).toEqual({ latitude: 10.7838, longitude: 106.6353 });
  });

  it('should parse WKT point string correctly', () => {
    const wkt = 'POINT(106.6353 10.7838)';
    const result = parsePoint(wkt);
    expect(result).toEqual({ latitude: 10.7838, longitude: 106.6353 });
  });

  it('should parse PostGIS WKB hex string points correctly with SRID 4326', () => {
    // 106.702313, 10.74973
    const wkbWithSrid = '0101000020E610000048C6C5ACF2AC5A4047551344DD7F2540';
    const result = parsePoint(wkbWithSrid);
    
    expect(result).toBeDefined();
    expect(result?.longitude).toBeCloseTo(106.702313, 4);
    expect(result?.latitude).toBeCloseTo(10.74973, 4);
  });

  it('should parse PostGIS WKB hex string points correctly without SRID', () => {
    // 106.702313, 10.74973 in WKB without SRID
    // 01 = Little endian
    // 01000000 = Point type (no SRID flag)
    // 48C6C5ACF2AC5A40 = 106.702313
    // 47551344DD7F2540 = 10.74973
    const wkbNoSrid = '010100000048C6C5ACF2AC5A4047551344DD7F2540';
    const result = parsePoint(wkbNoSrid);
    
    expect(result).toBeDefined();
    expect(result?.longitude).toBeCloseTo(106.702313, 4);
    expect(result?.latitude).toBeCloseTo(10.74973, 4);
  });

  it('should return undefined for invalid input', () => {
    expect(parsePoint(null)).toBeUndefined();
    expect(parsePoint(undefined)).toBeUndefined();
    expect(parsePoint({})).toBeUndefined();
    expect(parsePoint('INVALID_HEX')).toBeUndefined();
  });
});
