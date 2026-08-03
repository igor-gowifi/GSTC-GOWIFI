import { Solicitacao } from '@/types';

export const FILTER_TYPES = {
  DATA_CRIACAO: 'dataCriacao',
  DATA_ATIVIDADE: 'dataAtividade',
  DATA_CONCLUSAO: 'dataConclusao',
  DIA: 'dia',
  SEMANA: 'semana',
  MES: 'mes',
  ANO: 'ano',
  PROJETO: 'projeto',
  STATUS: 'status',
  EMPRESA: 'empresa',
};

export const DIA_OPCOES = {
  HOJE: 'hoje',
  ONTEM: 'ontem',
  AMANHA: 'amanha',
};

export const SEMANA_OPCOES = {
  ESTA: 'estaSemana',
  PASSADA: 'semanPassada',
  SEMANA_1: 'semana1',
  SEMANA_2: 'semana2',
  SEMANA_3: 'semana3',
  SEMANA_4: 'semana4',
};

export function parseDateString(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

export function formatarDataBR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getDateForFilter(sol: Solicitacao, filterType: string): Date | null {
  switch (filterType) {
    case FILTER_TYPES.DATA_CRIACAO:
      return sol.dataCriacao ? parseDateString(sol.dataCriacao) : null;
    case FILTER_TYPES.DATA_ATIVIDADE:
      return sol.dataAtividade ? parseDateString(sol.dataAtividade) : null;
    case FILTER_TYPES.DATA_CONCLUSAO:
      return sol.dataConclusao ? parseDateString(sol.dataConclusao) : null;
    default:
      return null;
  }
}

export function filterByDay(solicitacoes: Solicitacao[], diaOpcao: string): Solicitacao[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return solicitacoes.filter(sol => {
    const dataSol = getDateForFilter(sol, FILTER_TYPES.DATA_CRIACAO);
    if (!dataSol) return false;

    switch (diaOpcao) {
      case DIA_OPCOES.HOJE:
        return dataSol.toDateString() === hoje.toDateString();
      case DIA_OPCOES.ONTEM:
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        return dataSol.toDateString() === ontem.toDateString();
      case DIA_OPCOES.AMANHA:
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);
        return dataSol.toDateString() === amanha.toDateString();
      default:
        return false;
    }
  });
}

export function filterByWeek(solicitacoes: Solicitacao[], semanaOpcao: string): Solicitacao[] {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  return solicitacoes.filter(sol => {
    const dataSol = getDateForFilter(sol, FILTER_TYPES.DATA_CRIACAO);
    if (!dataSol) return false;

    const anoSol = dataSol.getFullYear();
    const mesSol = dataSol.getMonth();

    if (anoSol !== anoAtual || mesSol !== mesAtual) return false;

    const diaSol = dataSol.getDate();
    const diaSemana = dataSol.getDay();
    const inicioSemana = diaSol - diaSemana;

    switch (semanaOpcao) {
      case SEMANA_OPCOES.ESTA:
        const inicioEstaSemana = hoje.getDate() - hoje.getDay();
        const fimEstaSemana = inicioEstaSemana + 6;
        return diaSol >= inicioEstaSemana && diaSol <= fimEstaSemana;

      case SEMANA_OPCOES.PASSADA:
        const inicioSemanPassada = hoje.getDate() - hoje.getDay() - 7;
        const fimSemanPassada = inicioSemanPassada + 6;
        return diaSol >= inicioSemanPassada && diaSol <= fimSemanPassada;

      case SEMANA_OPCOES.SEMANA_1:
        return diaSol >= 1 && diaSol <= 7;
      case SEMANA_OPCOES.SEMANA_2:
        return diaSol >= 8 && diaSol <= 14;
      case SEMANA_OPCOES.SEMANA_3:
        return diaSol >= 15 && diaSol <= 21;
      case SEMANA_OPCOES.SEMANA_4:
        return diaSol >= 22 && diaSol <= 31;

      default:
        return false;
    }
  });
}

export function filterByMonth(solicitacoes: Solicitacao[], mes: number, ano: number): Solicitacao[] {
  return solicitacoes.filter(sol => {
    const dataSol = getDateForFilter(sol, FILTER_TYPES.DATA_CRIACAO);
    if (!dataSol) return false;
    return dataSol.getMonth() === mes - 1 && dataSol.getFullYear() === ano;
  });
}

export function filterByYear(solicitacoes: Solicitacao[], ano: number): Solicitacao[] {
  return solicitacoes.filter(sol => {
    const dataSol = getDateForFilter(sol, FILTER_TYPES.DATA_CRIACAO);
    if (!dataSol) return false;
    return dataSol.getFullYear() === ano;
  });
}

export function filterByDateRange(solicitacoes: Solicitacao[], dataInicio: string, dataFim: string, filterType: string): Solicitacao[] {
  const inicio = parseDateString(dataInicio);
  const fim = parseDateString(dataFim);

  if (!inicio || !fim) return solicitacoes;

  return solicitacoes.filter(sol => {
    const dataSol = getDateForFilter(sol, filterType);
    if (!dataSol) return false;
    return dataSol >= inicio && dataSol <= fim;
  });
}

export function filterByProjeto(solicitacoes: Solicitacao[], projeto: string): Solicitacao[] {
  if (!projeto) return solicitacoes;
  return solicitacoes.filter(sol => sol.grupoProjeto === projeto);
}

export function filterByStatus(solicitacoes: Solicitacao[], status: string): Solicitacao[] {
  if (!status) return solicitacoes;
  return solicitacoes.filter(sol => sol.status === status);
}

export function filterByEmpresa(solicitacoes: Solicitacao[], empresa: string): Solicitacao[] {
  if (!empresa) return solicitacoes;
  return solicitacoes.filter(sol => {
    if (typeof sol.tecnicoEscolhido === 'object' && sol.tecnicoEscolhido?.empresa === empresa) return true;
    return false;
  });
}

export function applyAllFilters(
  solicitacoes: Solicitacao[],
  filters: {
    dataCriacao?: { inicio: string; fim: string };
    dataAtividade?: { inicio: string; fim: string };
    dataConclusao?: { inicio: string; fim: string };
    dia?: string;
    semana?: string;
    mes?: number;
    ano?: number;
    projeto?: string;
    status?: string;
    empresa?: string;
  }
): Solicitacao[] {
  let result = [...solicitacoes];

  if (filters.dataCriacao?.inicio && filters.dataCriacao?.fim) {
    result = filterByDateRange(result, filters.dataCriacao.inicio, filters.dataCriacao.fim, FILTER_TYPES.DATA_CRIACAO);
  }

  if (filters.dataAtividade?.inicio && filters.dataAtividade?.fim) {
    result = filterByDateRange(result, filters.dataAtividade.inicio, filters.dataAtividade.fim, FILTER_TYPES.DATA_ATIVIDADE);
  }

  if (filters.dataConclusao?.inicio && filters.dataConclusao?.fim) {
    result = filterByDateRange(result, filters.dataConclusao.inicio, filters.dataConclusao.fim, FILTER_TYPES.DATA_CONCLUSAO);
  }

  if (filters.dia) {
    result = filterByDay(result, filters.dia);
  }

  if (filters.semana) {
    result = filterByWeek(result, filters.semana);
  }

  if (filters.mes && filters.ano) {
    result = filterByMonth(result, filters.mes, filters.ano);
  } else if (filters.ano) {
    result = filterByYear(result, filters.ano);
  }

  if (filters.projeto) {
    result = filterByProjeto(result, filters.projeto);
  }

  if (filters.status) {
    result = filterByStatus(result, filters.status);
  }

  if (filters.empresa) {
    result = filterByEmpresa(result, filters.empresa);
  }

  return result;
}
