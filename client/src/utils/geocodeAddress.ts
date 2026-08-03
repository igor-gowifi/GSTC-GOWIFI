/**
 * Geocodificação automática de endereços usando Nominatim (OpenStreetMap)
 * Sem necessidade de API key - GRATUITO
 */

export interface Coordenadas {
  lat: number;
  lng: number;
}

export async function geocodeAddress(tecnico: {
  tec_cep: string;
  tec_rua: string;
  tec_numero: string;
  tec_bairro: string;
  tec_cidade: string;
  tec_uf: string;
}): Promise<Coordenadas | null> {
  try {
    // Tenta diferentes variações do endereço
    const addressVariations = [
      // Variação 1: Sem Brasil, com bairro
      `${tecnico.tec_rua}, ${tecnico.tec_numero}, ${tecnico.tec_bairro}, ${tecnico.tec_cidade}, ${tecnico.tec_uf}`,
      // Variação 2: Apenas rua, número, cidade e estado
      `${tecnico.tec_rua}, ${tecnico.tec_numero}, ${tecnico.tec_cidade}, ${tecnico.tec_uf}`,
      // Variação 3: Com CEP se disponível
      tecnico.tec_cep ? `${tecnico.tec_cep}, ${tecnico.tec_cidade}, ${tecnico.tec_uf}` : null,
      // Variação 4: Apenas bairro, cidade e estado
      `${tecnico.tec_bairro}, ${tecnico.tec_cidade}, ${tecnico.tec_uf}`,
    ].filter(Boolean) as string[];

    for (const enderecoCompleto of addressVariations) {
      console.log('🔍 Geocodificando:', enderecoCompleto);
      
      // Usa Nominatim (GRATUITO, sem API key)
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'GoWiFiApp/1.0' } // Obrigatório pro Nominatim
      });
      
      const results = await response.json();
      
      if (results.length > 0) {
        const coords: Coordenadas = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon)
        };
        console.log('✅ Coordenadas encontradas com:', enderecoCompleto);
        console.log('✅ Resultado:', coords);
        return coords;
      }
    }
    
    console.warn('❌ Endereço não encontrado em nenhuma variação');
    return null;
  } catch (error) {
    console.error('❌ Erro geocodificação:', error);
    return null;
  }
}
