export interface Coordenadas {
  lat: number;
  lon: number;
}

export async function geocodeAddress(endereco: {
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
}): Promise<Coordenadas | null> {
  try {
    const enderecoFormatado = `${endereco.rua}, ${endereco.numero}, ${endereco.bairro}, ${endereco.cidade}, ${endereco.uf}, Brasil`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(enderecoFormatado)}&format=json`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error('Erro ao fazer geocoding:', error);
    return null;
  }
}

export async function searchNominatim(query: string): Promise<Coordenadas | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(url);
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
