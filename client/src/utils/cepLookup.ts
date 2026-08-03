/**
 * CEP Lookup - Fetch address details from Brazilian CEP using ViaCEP API
 */

export interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Buscar endereço pelo CEP usando a API ViaCEP
 * @param cep CEP sem formatação (apenas números)
 * @returns Dados do endereço ou null se não encontrado
 */
export async function buscarEnderecoPorCEP(cep: string): Promise<EnderecoViaCEP | null> {
  try {
    // Remover caracteres especiais do CEP
    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      console.warn('CEP deve ter 8 dígitos');
      return null;
    }

    const url = `https://viacep.com.br/ws/${cepLimpo}/json/`;
    const response = await fetch(url);
    const data: EnderecoViaCEP = await response.json();

    if (data.erro) {
      console.warn('CEP não encontrado:', cepLimpo);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Formatar CEP para o padrão brasileiro (XXXXX-XXX)
 */
export function formatarCEP(cep: string): string {
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length === 8) {
    return `${cepLimpo.slice(0, 5)}-${cepLimpo.slice(5)}`;
  }
  return cep;
}

/**
 * Converter dados do ViaCEP para o formato esperado pela aplicação
 */
export function converterEnderecoViaCEP(endereco: EnderecoViaCEP): {
  rua: string;
  bairro: string;
  cidade: string;
  uf: string;
} {
  return {
    rua: endereco.logradouro || '',
    bairro: endereco.bairro || '',
    cidade: endereco.localidade || '',
    uf: endereco.uf || ''
  };
}
