/**
 * Geocoding helper for converting addresses to coordinates
 * Uses OpenStreetMap Nominatim API as fallback
 * Future: Can be upgraded to use Google Maps Geocoding API when available
 */

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
}

/**
 * Geocode an address to latitude and longitude
 * @param address - Full address string
 * @returns GeocodeResult with coordinates or null if failed
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    if (!address || address.trim().length === 0) {
      return null;
    }

    // Use Nominatim (OpenStreetMap) for geocoding
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`
    );

    if (!response.ok) {
      console.error('Geocoding API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn('No geocoding results for address:', address);
      return null;
    }

    const result = data[0];
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Origin latitude
 * @param lon1 - Origin longitude
 * @param lat2 - Destination latitude
 * @param lon2 - Destination longitude
 * @returns Distance in kilometers
 */
export function calculateDistanceHaversine(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Build full address from components
 */
export function buildFullAddress(
  rua?: string | null,
  numero?: string | null,
  complemento?: string | null,
  bairro?: string | null,
  cidade?: string | null,
  uf?: string | null,
  cep?: string | null
): string {
  const parts: string[] = [];

  if (rua) parts.push(rua);
  if (numero) parts.push(numero);
  if (complemento) parts.push(complemento);
  if (bairro) parts.push(bairro);
  if (cidade) parts.push(cidade);
  if (uf) parts.push(uf);
  if (cep) parts.push(cep);

  return parts.join(', ');
}
