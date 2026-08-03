import { ENV } from './_core/env';

// Database functions now use Supabase exclusively
// MySQL/Drizzle dependency removed to align with user requirement

async function getSupabaseClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function insertAuditLog(log: any): Promise<void> {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('audit_logs').insert([log]);
    if (error) {
      console.error("[Supabase] Failed to insert audit log:", error);
    }
  } catch (error) {
    console.error("[Supabase] Error in insertAuditLog:", error);
  }
}

export async function getAuditLogs(limit: number = 1000) {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error("[Supabase] Failed to get audit logs:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("[Supabase] Error in getAuditLogs:", error);
    return [];
  }
}

// Function to calculate distance between two coordinates (Haversine formula)
function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Find 10 nearest technicians by distance
export async function findNearestTecnicos(latitude: number, longitude: number, limit: number = 10, sortBy: 'distance' | 'rating' = 'distance') {
  try {
    const supabase = await getSupabaseClient();

    const { data: tecnicos, error } = await supabase
      .from("tecnicos")
      .select("*")
      .eq("tec_ativo", true);

    if (error) {
      console.error("Error fetching technicians:", error);
      return [];
    }

    if (!tecnicos || tecnicos.length === 0) {
      return [];
    }

    // Calculate distance for each technician
    const tecnicosComDistancia = tecnicos
      .map((tec: any) => {
        const tecLat = parseFloat(tec.tec_latitude) || 0;
        const tecLon = parseFloat(tec.tec_longitude) || 0;
        
        if (tecLat === 0 || tecLon === 0) {
          return null;
        }

        const distancia = calcularDistancia(tecLat, tecLon, latitude, longitude);
        return {
          ...tec,
          latitude,
          longitude,
          distancia,
        };
      })
      .filter((tec: any) => tec !== null)
      .sort((a: any, b: any) => {
        if (sortBy === 'rating') {
          const ratingA = parseFloat(a.tec_avaliacao) || 0;
          const ratingB = parseFloat(b.tec_avaliacao) || 0;
          return ratingB - ratingA;
        } else {
          return a.distancia - b.distancia;
        }
      })
      .slice(0, limit);

    return tecnicosComDistancia;
  } catch (error) {
    console.error("Error finding nearest technicians:", error);
    return [];
  }
}

// Geocoding helper function
export async function geocodeAddress(rua: string, numero: string, bairro: string, cidade: string, uf: string, cep?: string) {
  try {
    const addressVariations = [
      cep ? `${cep}, ${cidade}, ${uf}` : null,
      `${bairro}, ${cidade}, ${uf}`,
      `${cidade}, ${uf}`,
    ].filter(Boolean) as string[];

    for (const endereco of addressVariations) {
      try {
        console.log(`🔍 Geocodificando: ${endereco}`);
        
        const googleResult = await tryGoogleMapsGeocoding(endereco);
        if (googleResult) {
          return googleResult;
        }
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`, 
          { signal: AbortSignal.timeout(8000) }
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            long: parseFloat(data[0].lon)
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (innerErr) {
        console.warn(`⚠️ Erro ao geocodificar ${endereco}:`, innerErr);
      }
    }
    return null;
  } catch (err) {
    console.error('Geocoding error:', err);
    return null;
  }
}

async function tryGoogleMapsGeocoding(address: string): Promise<{ lat: number; long: number } | null> {
  try {
    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!googleMapsApiKey) return null;

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        long: location.lng
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function calcularAvaliacaoMedia(
  pontualidade: number = 0,
  ferramentas: number = 0,
  produtividade: number = 0,
  conhecimento: number = 0,
  flexibilidade: number = 0
): number {
  const soma = pontualidade + ferramentas + produtividade + conhecimento + flexibilidade;
  const media = soma / 5;
  return Math.round(media * 100) / 100;
}

export async function getEquipamentoHistoricoByTecnico(tecnicoId: string) {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tecnicos_equipamentos_historico")
      .select("*")
      .eq("tecnico_id", tecnicoId)
      .eq('equip_ativo', 'true')
      .order("data_saida", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getAllEquipamentoHistorico() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tecnicos_equipamentos_historico")
      .select(`
        *,
        tecnicos:tecnico_id (
          id,
          tec_nome,
          tec_telefone,
          tec_cpf
        )
      `)
      .eq('equip_ativo', 'true')
      .order("data_saida", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function createEquipamentoHistorico(
  tecnicoId: string,
  equipamentoNome: string,
  equipamentoMarca?: string,
  equipamentoModelo?: string,
  equipamentoIdEstoque?: string,
  equipamentoDescricao?: string,
  observacoes?: string,
  criadoPor?: string
) {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tecnicos_equipamentos_historico")
      .insert([
        {
          tecnico_id: tecnicoId,
          equipamento_nome: equipamentoNome,
          equipamento_marca: equipamentoMarca,
          equipamento_modelo: equipamentoModelo,
          equipamento_id_estoque: equipamentoIdEstoque,
          equipamento_descricao: equipamentoDescricao,
          status: "emprestado",
          observacoes,
          criado_por: criadoPor,
        },
      ])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    throw error;
  }
}

export async function updateEquipamentoStatusDevolvido(
  equipamentoHistoricoId: string,
  atualizadoPor?: string
) {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tecnicos_equipamentos_historico")
      .update({
        status: "devolvido",
        data_devolucao: new Date().toISOString(),
        atualizado_por: atualizadoPor,
      })
      .eq("id", equipamentoHistoricoId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    throw error;
  }
}

export async function getEquipamentoHistoricoByStatus(status: "emprestado" | "devolvido" | "usado_em_cliente") {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("tecnicos_equipamentos_historico")
      .select(`
        *,
        tecnicos:tecnico_id (
          id,
          tec_nome,
          tec_telefone,
          tec_cpf
        )
      `)
      .eq("status", status)
      .eq('equip_ativo', 'true')
      .order("data_saida", { ascending: false });

    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
}

export async function getAuditLogsByRole(userRole: string, limit: number = 1000) {
  try {
    const logs = await getAuditLogs(limit);
    if (userRole === 'admin') {
      return logs.filter((log: any) => !log.acao?.includes('adminmaster'));
    } else if (userRole === 'analista') {
      return [];
    }
    return logs;
  } catch (error) {
    return [];
  }
}
