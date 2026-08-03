import { describe, it, expect } from 'vitest';
import { calculateDistanceHaversine, buildFullAddress } from './geocodingHelper';

describe('Geocoding Helper', () => {
  it('should build full address correctly', () => {
    const address = buildFullAddress(
      'Rua Augusta',
      '2500',
      'Apto 101',
      'Centro',
      'São Paulo',
      'SP',
      '01305-100'
    );

    expect(address).toContain('Rua Augusta');
    expect(address).toContain('2500');
    expect(address).toContain('Apto 101');
    expect(address).toContain('Centro');
    expect(address).toContain('São Paulo');
    expect(address).toContain('SP');
    expect(address).toContain('01305-100');
  });

  it('should build address without optional fields', () => {
    const address = buildFullAddress(
      'Rua Augusta',
      '2500',
      undefined,
      'Centro',
      'São Paulo',
      'SP'
    );

    expect(address).toContain('Rua Augusta');
    expect(address).toContain('2500');
    expect(address).toContain('Centro');
    expect(address).not.toContain('undefined');
  });

  it('should calculate distance using Haversine formula', () => {
    // São Paulo to Rio de Janeiro (approximately 360 km straight line)
    const distance = calculateDistanceHaversine(
      -23.5505, // São Paulo latitude
      -46.6333, // São Paulo longitude
      -22.9068, // Rio de Janeiro latitude
      -43.1729  // Rio de Janeiro longitude
    );

    // Should be approximately 360 km (allow margin for formula accuracy)
    expect(distance).toBeGreaterThan(350);
    expect(distance).toBeLessThan(370);
  });

  it('should return 0 distance for same coordinates', () => {
    const distance = calculateDistanceHaversine(-23.5505, -46.6333, -23.5505, -46.6333);
    expect(distance).toBe(0);
  });

  it('should calculate distance between different cities', () => {
    // São Paulo to Campinas (approximately 100 km)
    const distance = calculateDistanceHaversine(
      -23.5505, // São Paulo
      -46.6333,
      -22.8945, // Campinas
      -47.0626
    );

    expect(distance).toBeGreaterThan(80);
    expect(distance).toBeLessThan(95);
  });

  it('should return null for empty address', async () => {
    const { geocodeAddress } = await import('./geocodingHelper');
    const result = await geocodeAddress('');
    expect(result).toBeNull();
  });
});
