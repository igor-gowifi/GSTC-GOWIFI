export function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

  let soma = 0;
  let resto;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
  }

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

  return true;
}

export function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11;
}

export function validarCEP(cep: string): boolean {
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}

export function validarCampo(campo: string, valor: any): string | null {
  if (!valor || (typeof valor === 'string' && !valor.trim())) {
    return `${campo} é obrigatório`;
  }
  return null;
}

export function validarFormularioTecnico(dados: any): string[] {
  const erros: string[] = [];

  const camposObrigatorios = [
    'tecNome',
    'tecTelefone',
    'tecCPF',
    'tecCEP',
    'tecRua',
    'tecNumero',
    'tecBairro',
    'tecCidade',
    'tecUF',
    'tecEmpresaParceira',
  ];

  camposObrigatorios.forEach(campo => {
    if (!dados[campo] || (typeof dados[campo] === 'string' && !dados[campo].trim())) {
      const nomesCampos: { [key: string]: string } = {
        tecNome: 'Nome',
        tecTelefone: 'Telefone',
        tecCPF: 'CPF',
        tecCEP: 'CEP',
        tecRua: 'Rua',
        tecNumero: 'Número',
        tecBairro: 'Bairro',
        tecCidade: 'Cidade',
        tecUF: 'UF',
        tecEmpresaParceira: 'Empresa Parceira',
      };
      erros.push(`${nomesCampos[campo] || campo} é obrigatório`);
    }
  });

  if (dados.tecCPF && !validarCPF(dados.tecCPF)) {
    erros.push('CPF inválido');
  }

  if (dados.tecTelefone && !validarTelefone(dados.tecTelefone)) {
    erros.push('Telefone inválido');
  }

  if (dados.tecCEP && !validarCEP(dados.tecCEP)) {
    erros.push('CEP inválido');
  }

  return erros;
}

export function validarFormularioSolicitacao(dados: any): string[] {
  const erros: string[] = [];

  const camposObrigatorios = [
    'detailAtividade',
    'grupoProjeto',
    'detailServico',
    'detailOperadora',
    'detailFreshdesk',
    'detailContatoLocal',
    'dataAtividade',
    'horaAtividade',
    'nsSolicitacaoCEP',
    'nsSolicitacaoRua',
    'nsSolicitacaoNumero',
    'nsSolicitacaoBairro',
    'nsSolicitacaoCidade',
    'nsSolicitacaoUF',
  ];

  camposObrigatorios.forEach(campo => {
    if (!dados[campo] || (typeof dados[campo] === 'string' && !dados[campo].trim())) {
      const nomesCampos: { [key: string]: string } = {
        detailAtividade: 'Nome da Atividade',
        grupoProjeto: 'Grupo de Projeto',
        detailServico: 'Serviço',
        detailOperadora: 'Operadora',
        detailFreshdesk: 'Freshdesk Ticket',
        detailContatoLocal: 'Contato Local',
        dataAtividade: 'Data da Atividade',
        horaAtividade: 'Hora da Atividade',
        nsSolicitacaoCEP: 'CEP',
        nsSolicitacaoRua: 'Rua',
        nsSolicitacaoNumero: 'Número',
        nsSolicitacaoBairro: 'Bairro',
        nsSolicitacaoCidade: 'Cidade',
        nsSolicitacaoUF: 'UF',
      };
      erros.push(`${nomesCampos[campo] || campo} é obrigatório`);
    }
  });

  if (dados.nsSolicitacaoCEP && !validarCEP(dados.nsSolicitacaoCEP)) {
    erros.push('CEP inválido');
  }

  return erros;
}

export function validarCoordenadas(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

export function validarConsultaEndereco(dados: any): string[] {
  const erros: string[] = [];

  if (!dados.consultaCEP || !dados.consultaCEP.trim()) {
    erros.push('CEP é obrigatório');
  } else if (!validarCEP(dados.consultaCEP)) {
    erros.push('CEP inválido');
  }

  if (!dados.consultaCidade || !dados.consultaCidade.trim()) {
    erros.push('Cidade é obrigatória');
  }

  if (!dados.consultaUF || !dados.consultaUF.trim()) {
    erros.push('UF é obrigatória');
  }

  return erros;
}
