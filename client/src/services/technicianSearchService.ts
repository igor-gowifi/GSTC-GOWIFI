interface Coordinates {
  lat: number;
  lng: number;
}

interface Tecnico {
  tec_id: number;
  tec_nome: string;
  tec_cpf?: string;
  tec_telefone?: string;
  tec_latitude?: number;
  tec_longitude?: number;
  tec_empresa_parceira?: string;
  tec_avaliacao?: number;
  [key: string]: any;
}

export interface TecnicoComDistancia extends Tecnico {
  distanciaKm: number;
}

// 1. Função matemática para calcular distância em KM entre duas coordenadas (Haversine)
export function calculateDistanceKm(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371; // Raio da Terra em km
  const dLat = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const dLon = ((coords2.lng - coords1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coords1.lat * Math.PI) / 180) *
      Math.cos((coords2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Retorna com 1 casa decimal
}

// 2. Motor principal: recebe a lista de todos os técnicos e a localização/CEP alvo
export function filterAndSortNearbyTechnicians(
  tecnicos: Tecnico[],
  targetCoords: Coordinates,
  limit: number = 5 // Em vez de maxRadiusKm, usar limite
): TecnicoComDistancia[] {
  return tecnicos
    .filter((tec) => tec.tec_latitude && tec.tec_longitude)
    .map((tec) => {
      const distancia = calculateDistanceKm(targetCoords, {
        lat: Number(tec.tec_latitude),
        lng: Number(tec.tec_longitude),
      });
      return { ...tec, distanciaKm: distancia };
    })
    .sort((a, b) => a.distanciaKm - b.distanciaKm)
    .slice(0, limit); // Retorna os N mais próximos (ex: 5)
}
