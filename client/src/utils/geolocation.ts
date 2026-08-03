/**
 * Geolocation and Distance Calculation Utilities
 * Extracted from original HTML implementation
 */

// Validação de coordenadas
export function validarCoordenadas(lat: number, lon: number, nomePonto: string): boolean {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    console.error('[VALIDACAO]', nomePonto, ': lat/lon nao sao numeros');
    return false;
  }
  if (isNaN(lat) || isNaN(lon)) {
    console.error('[VALIDACAO]', nomePonto, ': lat/lon sao NaN');
    return false;
  }
  if (lat < -90 || lat > 90) {
    console.error('[VALIDACAO]', nomePonto, ': latitude fora do range');
    return false;
  }
  if (lon < -180 || lon > 180) {
    console.error('[VALIDACAO]', nomePonto, ': longitude fora do range');
    return false;
  }
  return true;
}

// Calcular distância usando OSRM (Open Source Routing Machine)
export async function calcularDistanciaTrajeto(lat1: number, lon1: number, lat2: number, lon2: number): Promise<number | null> {
  try {
    if (!validarCoordenadas(lat1, lon1, 'Ponto1')) return null;
    if (!validarCoordenadas(lat2, lon2, 'Ponto2')) return null;

    console.log('[OSRM-DEBUG] Coordenadas enviadas:', {
      inicio: { lat: lat1, lon: lon1 },
      fim: { lat: lat2, lon: lon2 }
    });

    const url = 'https://router.project-osrm.org/route/v1/driving/' + lon1 + ',' + lat1 + ';' + lon2 + ',' + lat2 + '?overview=false';
    console.log('[OSRM-DEBUG] URL:', url);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn('[OSRM] Erro HTTP:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('[OSRM] Nenhuma rota encontrada. Code:', data.code);
      return null;
    }

    const distanciaMetros = data.routes[0].distance;
    const distanciaKm = distanciaMetros / 1000;
    const duracao = data.routes[0].duration;

    console.log('[OSRM-DEBUG] Resposta completa:', {
      distanciaMetros: distanciaMetros,
      distanciaKm: distanciaKm.toFixed(2),
      duracao: duracao,
      code: data.code
    });

    console.log('[OSRM] Distancia de trajeto:', distanciaKm.toFixed(2), 'km');
    return distanciaKm;
  } catch (error) {
    console.error('[OSRM] Erro ao calcular distancia:', error);
    return null;
  }
}

// Calcular distância usando Haversine (fórmula de distância entre dois pontos na esfera)
export function calcularDistancia(lat1: number, lng1: number, lat2: number, lng2: number): number {
  if (!validarCoordenadas(lat1, lng1, 'Ponto1')) return 0;
  if (!validarCoordenadas(lat2, lng2, 'Ponto2')) return 0;

  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distancia = R * c;
  console.log('[HAVERSINE] Distancia calculada:', distancia.toFixed(2), 'km');
  return distancia;
}

// Buscar coordenadas usando Nominatim (OpenStreetMap)
export async function searchNominatim(query: string, retries = 3): Promise<any> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    console.log('🔍 Buscando no Nominatim:', query);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.length > 0) {
      console.log('✅ Nominatim encontrou:', data[0]);
      return data[0];
    }
    
    if (retries > 0) {
      console.log('Tentando novamente... retries:', retries);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return searchNominatim(query, retries - 1);
    }
    
    console.log('❌ Nominatim nao encontrou resultado');
    return null;
  } catch (error) {
    console.error('Erro ao buscar no Nominatim:', error);
    return null;
  }
}

// Geocodificar endereço completo
export async function geocodificarEndereco(endereco: {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
}): Promise<{ lat: number; lng: number } | null> {
  try {
    const enderecoCompleto = `${endereco.rua || ''}, ${endereco.numero || ''}, ${endereco.bairro || ''}, ${endereco.cidade || ''}, ${endereco.uf || ''}`.replace(/,\s*,/g, ',').replace(/^,|,$/g, '').trim();
    
    console.log('🌍 Geocodificando endereço:', enderecoCompleto);
    
    let resultado = await searchNominatim(enderecoCompleto);
    
    // Se não encontrar, tentar com apenas cidade e estado
    if (!resultado) {
      console.log('Tentando com apenas cidade e estado');
      const enderecoSimples = `${endereco.cidade || ''}, ${endereco.uf || ''}`;
      resultado = await searchNominatim(enderecoSimples);
    }
    
    if (resultado) {
      return {
        lat: parseFloat(resultado.lat),
        lng: parseFloat(resultado.lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao geocodificar endereço:', error);
    return null;
  }
}
