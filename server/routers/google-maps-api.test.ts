import { describe, it, expect } from 'vitest';

describe('Google Maps API Key Validation', () => {
  it('should validate Google Maps API key is set', () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    expect(apiKey).toBeDefined();
    expect(apiKey).toBeTruthy();
    expect(apiKey).toMatch(/^AIzaSy/); // Google API keys start with AIzaSy
  });

  it('should test Google Maps Geocoding API with sample address', async () => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_MAPS_API_KEY not set');
    }

    try {
      const address = 'Avenida Paulista, 1000, São Paulo, SP, Brasil';
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      // Check if API returned successful response
      expect(data.status).toBe('OK');
      expect(data.results).toBeDefined();
      expect(data.results.length).toBeGreaterThan(0);

      // Validate coordinates format
      const location = data.results[0].geometry.location;
      expect(location.lat).toBeDefined();
      expect(location.lng).toBeDefined();
      expect(typeof location.lat).toBe('number');
      expect(typeof location.lng).toBe('number');

      console.log('✅ Google Maps API working correctly');
      console.log(`   Address: ${address}`);
      console.log(`   Coordinates: ${location.lat}, ${location.lng}`);
    } catch (error) {
      console.error('❌ Google Maps API test failed:', error);
      throw error;
    }
  });
});
