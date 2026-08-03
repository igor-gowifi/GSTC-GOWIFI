/**
 * Supabase Data Mapper - Converts between Supabase format and React format
 * Supabase uses snake_case with prefixes (tec_, solic_)
 * React expects camelCase with prefixes (tecNome, solicNome)
 */

import { Tecnico, Solicitacao, TecnicoEscolhido } from '@/types';

/**
 * Map Supabase Tecnico data to React Tecnico interface
 */
export function mapTecnicoFromSupabase(data: any): Tecnico {
  return {
    id: data.id || '',
    tecNome: data.tec_nome || '',
    tecTelefone: data.tec_telefone || '',
    tecCPF: data.tec_cpf || '',
    tecRG: data.tec_rg || '',
    tecCEP: data.tec_cep || '',
    tecRua: data.tec_rua || '',
    tecNumero: data.tec_numero || '',
    tecComplemento: data.tec_complemento || '',
    tecBairro: data.tec_bairro || '',
    tecCidade: data.tec_cidade || '',
    tecUF: data.tec_uf || '',
    tecEmpresaParceira: data.tec_empresa_parceira || '',

    tecObservacoes: data.tec_observacoes || '',
    tecAvaliacao: data.tec_avaliacao ? parseFloat(data.tec_avaliacao) : 0,
    lat: data.tec_latitude ? parseFloat(data.tec_latitude) : undefined,
    long: data.tec_longitude ? parseFloat(data.tec_longitude) : undefined,
    dataCriacao: data.tec_data_criacao || data.created_at,
    dataAtualizacao: data.tec_data_atualizacao || data.updated_at
  };
}

/**
 * Map React Tecnico interface to Supabase format
 */
export function mapTecnicoToSupabase(tecnico: Partial<Tecnico>): any {
  const mapped: any = {};
  
  if (tecnico.tecNome !== undefined) mapped.tec_nome = tecnico.tecNome;
  if (tecnico.tecTelefone !== undefined) mapped.tec_telefone = tecnico.tecTelefone;
  if (tecnico.tecCPF !== undefined) mapped.tec_cpf = tecnico.tecCPF;
  if (tecnico.tecRG !== undefined) mapped.tec_rg = tecnico.tecRG;
  if (tecnico.tecCEP !== undefined) mapped.tec_cep = tecnico.tecCEP;
  if (tecnico.tecRua !== undefined) mapped.tec_rua = tecnico.tecRua;
  if (tecnico.tecNumero !== undefined) mapped.tec_numero = tecnico.tecNumero;
  if (tecnico.tecComplemento !== undefined) mapped.tec_complemento = tecnico.tecComplemento;
  if (tecnico.tecBairro !== undefined) mapped.tec_bairro = tecnico.tecBairro;
  if (tecnico.tecCidade !== undefined) mapped.tec_cidade = tecnico.tecCidade;
  if (tecnico.tecUF !== undefined) mapped.tec_uf = tecnico.tecUF;
  if (tecnico.tecEmpresaParceira !== undefined) mapped.tec_empresa_parceira = tecnico.tecEmpresaParceira;

  if (tecnico.tecObservacoes !== undefined) mapped.tec_observacoes = tecnico.tecObservacoes;
  if (tecnico.tecAvaliacao !== undefined) mapped.tec_avaliacao = tecnico.tecAvaliacao;
  if (tecnico.lat !== undefined) mapped.tec_latitude = tecnico.lat;
  if (tecnico.long !== undefined) mapped.tec_longitude = tecnico.long;
  
  return mapped;
}

/**
 * Map Supabase Solicitacao data to React Solicitacao interface
 */
export function mapSolicitacaoFromSupabase(data: any): Solicitacao {
  return {
    id: data.id?.toString() || '',
    osNumber: data.solic_numero_os || '',
    nomeAtividade: data.solic_nome || '',
    grupoProjeto: data.solic_projeto || '',
    servico: data.solic_servico || '',
    operadora: data.solic_operadora || '',
    freshdeskTicket: data.solic_freshdesk || '',
    contatoLocal: data.solic_contato_local || '',
    dataAtividade: data.solic_data_atividade || '',
    horaAtividade: data.solic_hora_atividade || '',
    cep: data.solic_cep || '',
    rua: data.solic_rua || '',
    numero: data.solic_numero || '',
    complemento: data.solic_complemento || '',
    bairro: data.solic_bairro || '',
    cidade: data.solic_cidade || '',
    uf: data.solic_uf || '',
    endereco: data.solic_endereco || '',
    status: data.solic_status || 'pendente',
    tecnicoEscolhido: data.solic_tecnico_id || null,
    dataCriacao: data.solic_data_criacao || data.created_at,
    dataConclusao: data.solic_data_conclusao,
    horarioChegada: data.solic_horario_chegada || '',
    horarioLiberacao: data.solic_horario_liberacao || '',
    horarioTermino: data.solic_horario_termino || '',
    totalHorasTrabalhadas: data.solic_total_horas?.toString() || '',
    faturamento: data.solic_faturamento ? 'pago' : 'nao-pago',
    observacoes: data.solic_observacoes || '',
    dataAtualizacao: data.solic_data_atualizacao || data.updated_at,
    lat: data.solic_latitude ? parseFloat(data.solic_latitude) : undefined,
    lon: data.solic_longitude ? parseFloat(data.solic_longitude) : undefined
  };
}

/**
 * Map React Solicitacao interface to Supabase format
 */
export function mapSolicitacaoToSupabase(solicitacao: Partial<Solicitacao>): any {
  const mapped: any = {};
  
  if (solicitacao.nomeAtividade !== undefined) mapped.solic_nome = solicitacao.nomeAtividade;
  if (solicitacao.grupoProjeto !== undefined) mapped.solic_projeto = solicitacao.grupoProjeto;
  if (solicitacao.servico !== undefined) mapped.solic_servico = solicitacao.servico;
  if (solicitacao.operadora !== undefined) mapped.solic_operadora = solicitacao.operadora;
  if (solicitacao.freshdeskTicket !== undefined) mapped.solic_freshdesk = solicitacao.freshdeskTicket;
  if (solicitacao.contatoLocal !== undefined) mapped.solic_contato_local = solicitacao.contatoLocal;
  if (solicitacao.dataAtividade !== undefined) mapped.solic_data_atividade = solicitacao.dataAtividade;
  if (solicitacao.horaAtividade !== undefined) mapped.solic_hora_atividade = solicitacao.horaAtividade;
  if (solicitacao.cep !== undefined) mapped.solic_cep = solicitacao.cep;
  if (solicitacao.rua !== undefined) mapped.solic_rua = solicitacao.rua;
  if (solicitacao.numero !== undefined) mapped.solic_numero = solicitacao.numero;
  if (solicitacao.complemento !== undefined) mapped.solic_complemento = solicitacao.complemento;
  if (solicitacao.bairro !== undefined) mapped.solic_bairro = solicitacao.bairro;
  if (solicitacao.cidade !== undefined) mapped.solic_cidade = solicitacao.cidade;
  if (solicitacao.uf !== undefined) mapped.solic_uf = solicitacao.uf;
  if (solicitacao.status !== undefined) mapped.solic_status = solicitacao.status;
  if (solicitacao.tecnicoEscolhido !== undefined) mapped.solic_tecnico_id = solicitacao.tecnicoEscolhido;
  if (solicitacao.dataConclusao !== undefined) mapped.solic_data_conclusao = solicitacao.dataConclusao;
  if (solicitacao.horarioChegada !== undefined) mapped.solic_horario_chegada = solicitacao.horarioChegada;
  if (solicitacao.horarioLiberacao !== undefined) mapped.solic_horario_liberacao = solicitacao.horarioLiberacao;
  if (solicitacao.horarioTermino !== undefined) mapped.solic_horario_termino = solicitacao.horarioTermino;
  if (solicitacao.observacoes !== undefined) mapped.solic_observacoes = solicitacao.observacoes;
  if (solicitacao.lat !== undefined) mapped.solic_latitude = solicitacao.lat;
  if (solicitacao.lon !== undefined) mapped.solic_longitude = solicitacao.lon;
  if (solicitacao.osNumber !== undefined) mapped.solic_numero_os = solicitacao.osNumber;
  
  return mapped;
}

/**
 * Batch map tecnicos from Supabase
 */
export function mapTecnicosFromSupabase(tecnicos: any[]): Tecnico[] {
  return tecnicos.map(mapTecnicoFromSupabase);
}

/**
 * Batch map solicitacoes from Supabase
 */
export function mapSolicitacoesFromSupabase(solicitacoes: any[]): Solicitacao[] {
  return solicitacoes.map(mapSolicitacaoFromSupabase);
}
