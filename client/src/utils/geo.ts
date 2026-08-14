import { geocodeAddress as geocodeAddressSanitizado } from './geocodeAddress';

export interface Coordenadas {
  lat: number;
  lon: number;
}

// Reutiliza a lógica limpa e com fallbacks hierárquicos do geocodeAddress.ts
export async function geocodeAddress(endereco: {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}): Promise<Coordenadas | null> {
  const result = await geocodeAddressSanitizado({
    tec_cep: '', // Não precisa de CEP para o geocoding
    tec_rua: endereco.rua,
    tec_numero: endereco.numero,
    tec_bairro: endereco.bairro,
    tec_cidade: endereco.cidade,
    tec_uf: endereco.uf,
  });

  if (result) {
    return {
      lat: result.lat,
      lon: result.lng, // Mapeia 'lng' para 'lon' mantendo a interface do geo.ts
    };
  }

  return null;
}

// Ajustado com trava nacional &countrycodes=br para buscas genéricas
export async function searchNominatim(query: string): Promise<Coordenadas | null> {
  try {
    const queryComPais = query.toLowerCase().includes('brasil') ? query : `${query}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryComPais)}&format=json&countrycodes=br&limit=1`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GoWiFiApp/1.0' },
    });
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar no Nominatim:', error);
    return null;
  }
}

export function calcularDistanciaHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function calcularDistanciaOSRM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<number | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000; // Converter de metros para km
    }
    return null;
  } catch (error) {
    console.error('Erro ao calcular distância com OSRM:', error);
    return null;
  }
}

export async function calcularDistancia(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  useOSRM: boolean = true
): Promise<number> {
  if (useOSRM) {
    const distanciaOSRM = await calcularDistanciaOSRM(lat1, lon1, lat2, lon2);
    if (distanciaOSRM !== null) {
      return distanciaOSRM;
    }
  }

  // Fallback para Haversine
  return calcularDistanciaHaversine(lat1, lon1, lat2, lon2);
}

export function formatarDistancia(distancia: number): string {
  if (distancia < 1) {
    return `${Math.round(distancia * 1000)}m`;
  }
  return `${distancia.toFixed(2)}km`;
}

export function gerarURLMaps(lat: number, lon: number, zoom: number = 15): string {
  return `https://www.google.com/maps?q=${lat},${lon}&z=${zoom}`;
}

export function gerarURLRotaMaps(lat1: number, lon1: number, lat2: number, lon2: number): string {
  return `https://www.google.com/maps/dir/${lat1},${lon1}/${lat2},${lon2}`;
}