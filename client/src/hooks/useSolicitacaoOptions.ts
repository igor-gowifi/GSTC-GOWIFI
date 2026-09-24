export function useSolicitacaoOptions() {

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
  ];

  const SERVICOS = [
    'Desativação',
    'Instalação',
    'Suporte',
    'Troca de Endereço'
  ];

  const OPERADORAS = [
    'Claro Empresas',
    'Hughes',
    'Gowifi',
    'ViaSat',
    'Outro'
  ];


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


  return {
    GRUPOS_PROJETO,
    SERVICOS,
    OPERADORAS,
    statusMapping
  };
}