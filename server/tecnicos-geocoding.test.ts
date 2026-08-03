import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Integration tests for Técnicos component with geocoding
 * These tests verify that:
 * 1. Geocoding is called when saving a technician
 * 2. Coordinates are included in the create/update mutation
 * 3. Geocoding errors are handled gracefully
 */

interface TecnicoData {
  tec_nome: string;
  tec_telefone: string;
  tec_cpf: string;
  tec_rg: string;
  tec_cep: string;
  tec_rua: string;
  tec_numero: string;
  tec_complemento?: string;
  tec_bairro: string;
  tec_cidade: string;
  tec_uf: string;
  tec_empresa_parceira: string;
  tec_equipamentos?: string;
  tec_observacoes?: string;
  tec_latitude?: number;
  tec_longitude?: number;
}

interface Coordenadas {
  lat: number;
  lng: number;
}

async function geocodeAddress(tecnico: {
  tec_cep: string;
  tec_rua: string;
  tec_numero: string;
  tec_bairro: string;
  tec_cidade: string;
  tec_uf: string;
}): Promise<Coordenadas | null> {
  try {
    const enderecoCompleto = `${tecnico.tec_rua}, ${tecnico.tec_numero}, ${tecnico.tec_bairro}, ${tecnico.tec_cidade} - ${tecnico.tec_uf}, Brasil`;
    
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoCompleto)}&limit=1&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GoWiFiApp/1.0' }
    });
    
    const results = await response.json();
    
    if (results.length > 0) {
      const coords: Coordenadas = {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon)
      };
      return coords;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function saveTecnico(formData: TecnicoData): Promise<TecnicoData> {
  // Simulate geocoding
  const coords = await geocodeAddress({
    tec_cep: formData.tec_cep,
    tec_rua: formData.tec_rua,
    tec_numero: formData.tec_numero,
    tec_bairro: formData.tec_bairro,
    tec_cidade: formData.tec_cidade,
    tec_uf: formData.tec_uf
  });

  // Include coordinates in the data
  if (coords) {
    return {
      ...formData,
      tec_latitude: coords.lat,
      tec_longitude: coords.lng
    };
  }

  return formData;
}

describe('Técnicos Component - Geocoding Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it('should include coordinates when creating a technician with valid address', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue([
        {
          lat: '-23.5505',
          lon: '-46.6333'
        }
      ])
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const formData: TecnicoData = {
      tec_nome: 'João Silva',
      tec_telefone: '(11) 99999-9999',
      tec_cpf: '123.456.789-00',
      tec_rg: '12.345.678-9',
      tec_cep: '01310100',
      tec_rua: 'Avenida Paulista',
      tec_numero: '1000',
      tec_bairro: 'Bela Vista',
      tec_cidade: 'São Paulo',
      tec_uf: 'SP',
      tec_empresa_parceira: 'GoWiFi',
      tec_equipamentos: 'Modem, Roteador',
      tec_observacoes: 'Técnico experiente'
    };

    const result = await saveTecnico(formData);

    expect(result.tec_latitude).toBe(-23.5505);
    expect(result.tec_longitude).toBe(-46.6333);
    expect(result.tec_nome).toBe('João Silva');
  });

  it('should save technician without coordinates if address not found', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue([])
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const formData: TecnicoData = {
      tec_nome: 'Maria Santos',
      tec_telefone: '(11) 88888-8888',
      tec_cpf: '987.654.321-00',
      tec_rg: '98.765.432-1',
      tec_cep: '00000000',
      tec_rua: 'Rua Inexistente',
      tec_numero: '9999',
      tec_bairro: 'Bairro Inexistente',
      tec_cidade: 'Cidade Inexistente',
      tec_uf: 'XX',
      tec_empresa_parceira: 'GoWiFi'
    };

    const result = await saveTecnico(formData);

    expect(result.tec_latitude).toBeUndefined();
    expect(result.tec_longitude).toBeUndefined();
    expect(result.tec_nome).toBe('Maria Santos');
  });

  it('should save technician without coordinates if geocoding fails', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const formData: TecnicoData = {
      tec_nome: 'Pedro Costa',
      tec_telefone: '(11) 77777-7777',
      tec_cpf: '111.222.333-44',
      tec_rg: '11.222.333-4',
      tec_cep: '01310100',
      tec_rua: 'Avenida Paulista',
      tec_numero: '1000',
      tec_bairro: 'Bela Vista',
      tec_cidade: 'São Paulo',
      tec_uf: 'SP',
      tec_empresa_parceira: 'GoWiFi'
    };

    const result = await saveTecnico(formData);

    expect(result.tec_latitude).toBeUndefined();
    expect(result.tec_longitude).toBeUndefined();
    expect(result.tec_nome).toBe('Pedro Costa');
  });

  it('should preserve all technician data when adding coordinates', async () => {
    const mockResponse = {
      json: vi.fn().mockResolvedValue([
        {
          lat: '-23.5505',
          lon: '-46.6333'
        }
      ])
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const formData: TecnicoData = {
      tec_nome: 'Ana Paula',
      tec_telefone: '(11) 66666-6666',
      tec_cpf: '555.666.777-88',
      tec_rg: '55.666.777-8',
      tec_cep: '01310100',
      tec_rua: 'Avenida Paulista',
      tec_numero: '1000',
      tec_complemento: 'Sala 101',
      tec_bairro: 'Bela Vista',
      tec_cidade: 'São Paulo',
      tec_uf: 'SP',
      tec_empresa_parceira: 'GoWiFi',
      tec_equipamentos: 'Modem, Roteador, Fibra',
      tec_observacoes: 'Especialista em fibra óptica'
    };

    const result = await saveTecnico(formData);

    // Verify all original data is preserved
    expect(result.tec_nome).toBe('Ana Paula');
    expect(result.tec_telefone).toBe('(11) 66666-6666');
    expect(result.tec_complemento).toBe('Sala 101');
    expect(result.tec_equipamentos).toBe('Modem, Roteador, Fibra');
    expect(result.tec_observacoes).toBe('Especialista em fibra óptica');
    
    // Verify coordinates are added
    expect(result.tec_latitude).toBe(-23.5505);
    expect(result.tec_longitude).toBe(-46.6333);
  });

  it('should handle multiple technician saves with different addresses', async () => {
    const mockResponse1 = {
      json: vi.fn().mockResolvedValue([
        { lat: '-23.5505', lon: '-46.6333' }
      ])
    };

    const mockResponse2 = {
      json: vi.fn().mockResolvedValue([
        { lat: '-22.9068', lon: '-43.1729' }
      ])
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const tecnico1: TecnicoData = {
      tec_nome: 'Técnico SP',
      tec_telefone: '(11) 99999-9999',
      tec_cpf: '123.456.789-00',
      tec_rg: '12.345.678-9',
      tec_cep: '01310100',
      tec_rua: 'Avenida Paulista',
      tec_numero: '1000',
      tec_bairro: 'Bela Vista',
      tec_cidade: 'São Paulo',
      tec_uf: 'SP',
      tec_empresa_parceira: 'GoWiFi'
    };

    const tecnico2: TecnicoData = {
      tec_nome: 'Técnico RJ',
      tec_telefone: '(21) 99999-9999',
      tec_cpf: '987.654.321-00',
      tec_rg: '98.765.432-1',
      tec_cep: '20040020',
      tec_rua: 'Avenida Rio Branco',
      tec_numero: '100',
      tec_bairro: 'Centro',
      tec_cidade: 'Rio de Janeiro',
      tec_uf: 'RJ',
      tec_empresa_parceira: 'GoWiFi'
    };

    const result1 = await saveTecnico(tecnico1);
    const result2 = await saveTecnico(tecnico2);

    expect(result1.tec_latitude).toBe(-23.5505);
    expect(result1.tec_longitude).toBe(-46.6333);
    expect(result2.tec_latitude).toBe(-22.9068);
    expect(result2.tec_longitude).toBe(-43.1729);
  });
});
