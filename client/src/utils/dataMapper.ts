/**
 * Data Mapper - Converts Firebase data format to React expected format
 * Firebase uses snake_case or camelCase without prefix, React expects prefixed fields
 */

import { Tecnico, Solicitacao } from '@/types';

/**
 * Map Firebase Tecnico data to React Tecnico interface
 */
export function mapTecnicoFromFirebase(data: any, id: string): Tecnico {
  return {
    id,
    tecNome: data.nome || '',
    tecTelefone: data.telefone || '',
    tecCPF: data.cpf || '',
    tecRG: data.rg || '',
    tecCEP: data.cep || '',
    tecRua: data.rua || '',
    tecNumero: data.numero || '',
    tecComplemento: data.complemento || '',
    tecBairro: data.bairro || '',
    tecCidade: data.cidade || '',
    tecUF: data.uf || '',
    tecEmpresaParceira: data.empresaParceira || '',
    tecEquipamentos: data.equipamentos || '',
    tecObservacoes: data.observacoes || '',
    tecAvaliacao: data.avaliacao || 0,
    lat: data.lat,
    long: data.long,
    dataCriacao: data.dataCriacao,
    dataAtualizacao: data.dataAtualizacao
  };
}

/**
 * Map React Tecnico interface to Firebase format
 */
export function mapTecnicoToFirebase(tecnico: Partial<Tecnico>): any {
  return {
    nome: tecnico.tecNome,
    telefone: tecnico.tecTelefone,
    cpf: tecnico.tecCPF,
    rg: tecnico.tecRG,
    cep: tecnico.tecCEP,
    rua: tecnico.tecRua,
    numero: tecnico.tecNumero,
    complemento: tecnico.tecComplemento,
    bairro: tecnico.tecBairro,
    cidade: tecnico.tecCidade,
    uf: tecnico.tecUF,
    empresaParceira: tecnico.tecEmpresaParceira,
    equipamentos: tecnico.tecEquipamentos,
    observacoes: tecnico.tecObservacoes,
    avaliacao: tecnico.tecAvaliacao || 0,
    lat: tecnico.lat,
    long: tecnico.long,
    dataCriacao: tecnico.dataCriacao || new Date().toISOString(),
    dataAtualizacao: new Date().toISOString()
  };
}

/**
 * Map Firebase Solicitacao data to React Solicitacao interface
 */
export function mapSolicitacaoFromFirebase(data: any, id: string): Solicitacao {
  return {
    id,
    osNumber: data.numeroOS?.toString() || '',
    nomeAtividade: data.atividade || '',
    grupoProjeto: data.projeto || '',
    servico: data.grupoAtividade || '',
    operadora: data.operadora || '',
    freshdeskTicket: data.freshdeskTicket || '',
    contatoLocal: data.contatoLocal || '',
    dataAtividade: data.dataAtividade || '',
    horaAtividade: data.horaAtividade || '',
    cep: data.cep || '',
    rua: data.rua || '',
    numero: data.numero || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    cidade: data.cidade || '',
    uf: data.uf || '',
    endereco: data.endereco || '',
    status: data.status || 'pendente',
    tecnicoEscolhido: data.tecnicoEscolhido || null,
    dataCriacao: data.dataCriacao,
    dataConclusao: data.dataConclusao,
    horarioChegada: data.horarioChegada || '',
    horarioLiberacao: data.horarioLiberacao || '',
    horarioTermino: data.horarioTermino || '',
    totalHorasTrabalhadas: data.totalHorasTrabalhadas || '',
    faturamento: data.faturamento || 'nao-pago',
    observacoes: data.observacoes || '',
    dataAtualizacao: data.dataAtualizacao,
    lat: data.lat,
    lon: data.lon
  };
}

/**
 * Map React Solicitacao interface to Firebase format
 */
export function mapSolicitacaoToFirebase(solicitacao: Partial<Solicitacao>): any {
  return {
    atividade: solicitacao.nomeAtividade,
    projeto: solicitacao.grupoProjeto,
    grupoAtividade: solicitacao.servico,
    operadora: solicitacao.operadora,
    freshdeskTicket: solicitacao.freshdeskTicket,
    contatoLocal: solicitacao.contatoLocal,
    dataAtividade: solicitacao.dataAtividade,
    horaAtividade: solicitacao.horaAtividade,
    cep: solicitacao.cep,
    rua: solicitacao.rua,
    numero: solicitacao.numero,
    complemento: solicitacao.complemento,
    bairro: solicitacao.bairro,
    cidade: solicitacao.cidade,
    uf: solicitacao.uf,
    endereco: solicitacao.endereco,
    status: solicitacao.status,
    tecnicoEscolhido: solicitacao.tecnicoEscolhido,
    dataCriacao: solicitacao.dataCriacao || new Date().toISOString(),
    dataConclusao: solicitacao.dataConclusao,
    horarioChegada: solicitacao.horarioChegada,
    horarioLiberacao: solicitacao.horarioLiberacao,
    horarioTermino: solicitacao.horarioTermino,
    totalHorasTrabalhadas: solicitacao.totalHorasTrabalhadas,
    faturamento: solicitacao.faturamento,
    observacoes: solicitacao.observacoes,
    dataAtualizacao: new Date().toISOString(),
    numeroOS: solicitacao.osNumber,
    lat: solicitacao.lat,
    lon: solicitacao.lon
  };
}
