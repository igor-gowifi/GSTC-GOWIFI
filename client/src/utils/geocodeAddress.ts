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
    const rua = tecnico.tec_rua?.trim() || '';
    const bairro = tecnico.tec_bairro?.trim() || '';
    const cidade = tecnico.tec_cidade?.trim() || '';
    const uf = tecnico.tec_uf?.trim() || '';

    // 1. Sanitização do Número: descarta "s/n", "sn", "sem numero", etc.
    const numeroLimpo = tecnico.tec_numero?.trim() || '';
    const eNumeroValido =
      numeroLimpo !== '' &&
      !/^(s\/n|sn|sem\s*n[úu]mero|-)$/i.test(numeroLimpo);

    // 2. Construção da Hierarquia Segura (Sempre com Brasil ao final)
    const addressVariations: string[] = [];

    // Variação 1: Endereço completo (Apenas se houver número válido)
    if (rua && eNumeroValido && cidade && uf) {
      addressVariations.push(`${rua}, ${numeroLimpo}, ${bairro ? bairro + ', ' : ''}${cidade}, ${uf}, Brasil`);
    }

    // Variação 2: Rua + Bairro + Cidade + UF (Ignora o "s/n")
    if (rua && cidade && uf) {
      addressVariations.push(`${rua}, ${bairro ? bairro + ', ' : ''}${cidade}, ${uf}, Brasil`);
    }

    // Variação 3: Bairro + Cidade + UF
    if (bairro && cidade && uf) {
      addressVariations.push(`${bairro}, ${cidade}, ${uf}, Brasil`);
    }

    // Variação 4 (Âncora de Segurança Final): Apenas Cidade + UF
    // Impede que retorne fora do município (ex: Manaus) se o resto falhar.
    if (cidade && uf) {
      addressVariations.push(`${cidade}, ${uf}, Brasil`);
    }

    for (const enderecoCompleto of addressVariations) {
      console.log('🔍 Geocodificando:', enderecoCompleto);

      // Trava de país na URL: &countrycodes=br
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1&addressdetails=1&countrycodes=br`;

      const response = await fetch(url, {
        headers: { 'User-Agent': 'GoWiFiApp/1.0' },
      });

      const results = await response.json();

      if (results && results.length > 0) {
        const coords: Coordenadas = {
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
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