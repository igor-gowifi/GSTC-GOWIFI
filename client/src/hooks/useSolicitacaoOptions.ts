const GRUPOS_PROJETO = [
  'WiFi Seguro',
  'Projetos Especiais',
  'Bradesco',
  'Bradesco - Fase2',
  'Bradesco - Migrações',
  'Atacadão',
  'Novamed',
  'Santander',
  'PUC-SP',
  'Hotelaria',
  'Telemedicina',
  'Escola Santa Maria',
  'Viasat',
  'Daiki Sushi'
] as const;

const SERVICOS = [
  'Desativação',
  'Instalação',
  'Suporte',
  'Troca de Endereço'
] as const;

const OPERADORAS = [
  'Claro Empresas',
  'Hughes',
  'Gowifi',
  'ViaSat',
  'Outro'
] as const;

const statusMapping: Record<string, string> = {
  'pendente': 'Pendente',
  'Pendente': 'Pendente',

  'em_programacao': 'Em programação',
  'Em Programação': 'Em programação',
  'Em Progresso': 'Em programação',
  'em_progresso': 'Em programação',

  'atribuida': 'Agendado',
  'atribuido': 'Agendado',
  'agendado': 'Agendado',
  'Agendado': 'Agendado',

  'concluido': 'Concluído/Produtivo',
  'Concluido': 'Concluído/Produtivo',
  'Concluído': 'Concluído/Produtivo',

  'improdutivo': 'Improdutivo',
  'Improdutivo': 'Improdutivo',
  'improdutivas': 'Improdutivo',

  'cancelado': 'Cancelada',
  'Cancelado': 'Cancelada',
  'cancelada': 'Cancelada',
  'Cancelada': 'Cancelada',

  'aguardando_claro': 'Aguardando Claro',
  'Aguardando Claro': 'Aguardando Claro'
};

export function useSolicitacaoOptions() {
  return {
    GRUPOS_PROJETO,
    SERVICOS,
    OPERADORAS,
    statusMapping
  };
}

// Tipos TypeScript derivados para reutilização no projeto
export type GrupoProjeto = (typeof GRUPOS_PROJETO)[number];
export type Servico = (typeof SERVICOS)[number];
export type Operadora = (typeof OPERADORAS)[number];