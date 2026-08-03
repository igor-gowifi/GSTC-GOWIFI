/**
 * Helper functions for dynamic filtering based on sortBy parameter
 * All filters (dia, semana, mês, ano) use the date field selected in sortBy
 */

export type DateFieldType = 'solic_data_criacao' | 'solic_data_atividade' | 'solic_data_conclusao';

/**
 * Determine which date field to use for filtering based on sortBy
 * Default: solic_data_criacao (creation date)
 */
export function getDateFieldFromSortBy(sortBy?: string): DateFieldType {
  if (!sortBy) return 'solic_data_criacao';
  
  if (sortBy.includes('atividade')) {
    return 'solic_data_atividade';
  } else if (sortBy.includes('conclusao')) {
    return 'solic_data_conclusao';
  }
  
  return 'solic_data_criacao';
}

/**
 * Get display name for the current date field being filtered
 */
export function getDateFieldDisplayName(dateField: DateFieldType): string {
  switch (dateField) {
    case 'solic_data_atividade':
      return 'Data de Atividade';
    case 'solic_data_conclusao':
      return 'Data de Conclusão';
    case 'solic_data_criacao':
    default:
      return 'Data de Criação';
  }
}

/**
 * Check if a date matches a specific day (hoje, ontem, amanha)
 */
export function isDateInDay(
  date: Date,
  dayType: 'hoje' | 'ontem' | 'amanha'
): boolean {
  const hoje = new Date();
  const dateToCheck = new Date(date);
  
  const diaAtual = hoje.getDate();
  const diaSol = dateToCheck.getDate();
  const mesAtual = hoje.getMonth();
  const mesSol = dateToCheck.getMonth();
  const anoAtual = hoje.getFullYear();
  const anoSol = dateToCheck.getFullYear();
  
  if (dayType === 'hoje') {
    return diaAtual === diaSol && mesAtual === mesSol && anoAtual === anoSol;
  } else if (dayType === 'ontem') {
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    return diaSol === ontem.getDate() && mesSol === ontem.getMonth() && anoSol === ontem.getFullYear();
  } else if (dayType === 'amanha') {
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);
    return diaSol === amanha.getDate() && mesSol === amanha.getMonth() && anoSol === amanha.getFullYear();
  }
  
  return false;
}

/**
 * Check if a date is in a specific month and year
 */
export function isDateInMonth(
  date: Date,
  month: number,
  year: number
): boolean {
  const dateToCheck = new Date(date);
  return dateToCheck.getMonth() === month - 1 && dateToCheck.getFullYear() === year;
}

/**
 * Check if a date is in a specific year
 */
export function isDateInYear(
  date: Date,
  year: number
): boolean {
  const dateToCheck = new Date(date);
  return dateToCheck.getFullYear() === year;
}
