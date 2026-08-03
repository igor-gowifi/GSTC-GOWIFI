export const EMPRESAS_PARCEIRAS = [
  'infrafrele',
  'luciano-team',
  'findup',
  'gowifi'
];

export const PROJETOS = [
  'wifi-seguro',
  'projetos-especiais',
  'bradesco',
  'santander',
  'puc-universidade',
  'hotelarias',
  'telemedicina',
  'escola-santa-maria',
  'viasat',
  'daiki-sushi'
];

export const STATUS = [
  'pendente',
  'agendado',
  'concluido',
  'improdutivo'
];

export const SERVICOS = [
  'Instalação',
  'Manutenção',
  'Reparo',
  'Upgrade',
  'Suporte'
];

export const OPERADORAS = [
  'Vivo',
  'Claro',
  'Tim',
  'Oi',
  'Algar',
  'Outra'
];

export interface Tecnico {
  id: string;
  tecNome: string;
  tecTelefone: string;
  tecCPF: string;
  tecRG?: string;
  tecCEP: string;
  tecRua: string;
  tecNumero: string;
  tecComplemento?: string;
  tecBairro: string;
  tecCidade: string;
  tecUF: string;
  tecEmpresaParceira: string;
  tecEquipamentos?: string;
  tecObservacoes?: string;
  tecAvaliacao?: number;
  tecAvaliacaoPontualidade?: number;
  tecAvaliacaoFerramentas?: number;
  tecAvaliacaoProdutividade?: number;
  tecAvaliacaoConhecimento?: number;
  tecAvaliacaoFlexibilidade?: number;
  lat?: number;
  long?: number;
  dataCriacao?: string;
  dataAtualizacao?: string;
}

export interface TecnicoEscolhido {
  id: string;
  nome: string;
  empresa?: string;
  empresaParceira?: string;
  distancia?: number;
  telefone?: string;
  cpf?: string;
  rg?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  avaliacao?: number;
}

export interface Solicitacao {
  id: string;
  osNumber?: string;
  nomeAtividade: string;
  grupoProjeto: string;
  servico: string;
  operadora: string;
  freshdeskTicket: string;
  contatoLocal: string;
  dataAtividade: string;
  horaAtividade: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  endereco?: string;
  status: string;
  tecnicoEscolhido?: string | TecnicoEscolhido;
  dataCriacao?: string;
  dataConclusao?: string;
  horarioChegada?: string;
  horarioLiberacao?: string;
  horarioTermino?: string;
  totalHorasTrabalhadas?: string;
  faturamento?: 'pago' | 'nao-pago';
  observacoes?: string;
  dataAtualizacao?: string;
  lat?: number;
  lon?: number;
}

export interface DashboardStats {
  totalTecnicos: number;
  totalSolicitacoes: number;
  pendentes: number;
  atribuidas: number;
  concluidas: number;
  improdutivas: number;
  canceladas: number;
}

export interface User {
  uid: string;
  email: string;
  name?: string;
  role: 'adminmaster' | 'admin' | 'analista' | 'tecnico';
}

export type AuditActionType = 
  | 'TECNICO_CRIADO'
  | 'TECNICO_ATUALIZADO'
  | 'TECNICO_DELETADO'
  | 'SOLICITACAO_CRIADA'
  | 'SOLICITACAO_ATUALIZADA'
  | 'SOLICITACAO_DELETADA'
  | 'SOLICITACAO_CONCLUIDA'
  | 'TECNICO_ATRIBUIDO'
  | 'STATUS_ALTERADO'
  | 'USUARIO_LOGADO'
  | 'USUARIO_DESLOGADO';

export interface AuditLog {
  id: string;
  timestamp: number;
  dataFormatada: string;
  usuario: string;
  usuarioNome?: string;
  acao: AuditActionType;
  descricao: string;
  tipoDocumento: 'tecnico' | 'solicitacao' | 'login';
  idDocumento: string;
  dadosAntes?: Record<string, any>;
  dadosDepois?: Record<string, any>;
}


// Função para capitalizar texto (primeira letra maiúscula)
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('-');
};

// Mapa de exibição para valores em lowercase
export const DISPLAY_LABELS = {
  'infrafrele': 'Infrafrele',
  'luciano-team': 'Luciano-team',
  'findup': 'Findup',
  'gowifi': 'Gowifi',
  'wifi-seguro': 'Wifi-seguro',
  'projetos-especiais': 'Projetos-especiais',
  'bradesco': 'Bradesco',
  'santander': 'Santander',
  'puc-universidade': 'Puc-universidade',
  'hotelarias': 'Hotelarias',
  'telemedicina': 'Telemedicina',
  'escola-santa-maria': 'Escola-santa-maria',
  'viasat': 'Viasat',
  'daiki-sushi': 'Daiki-sushi',
  'pendente': 'Pendente',
  'agendado': 'Agendado',
  'concluido': 'Concluído',
  'improdutivo': 'Improdutivo'
};
