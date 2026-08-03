import * as XLSX from 'xlsx';

export interface SolicitacaoExportData {
  id: string;
  nomeAtividade: string;
  projeto: string;
  servico: string;
  operadora: string;
  freshdeskTicket: string;
  contatoLocal: string;
  endereco: string;
  cep: string;
  dataAtividade: string;
  horaAtividade: string;
  dataCriacao: string;
  dataConclusao: string;
  status: string;
  faturamento: string;
  tecnicoNome: string;
  tecnicoCPF: string;
  tecnicoTelefone: string;
  tecnicoEmpresa: string;
  observacoes: string;
}

export function generateExcelBuffer(solicitacoes: SolicitacaoExportData[]): Buffer {
  // Preparar dados para Excel
  const excelData = solicitacoes.map((solic, index) => ({
    '#': index + 1,
    'ID': solic.id,
    'Nome da Atividade': solic.nomeAtividade,
    'Projeto': solic.projeto,
    'Serviço': solic.servico,
    'Operadora': solic.operadora,
    'Ticket Freshdesk': solic.freshdeskTicket,
    'Contato Local': solic.contatoLocal,
    'Endereço': solic.endereco,
    'CEP': solic.cep,
    'Data da Atividade': solic.dataAtividade,
    'Hora da Atividade': solic.horaAtividade,
    'Data de Criação': solic.dataCriacao,
    'Data de Conclusão': solic.dataConclusao,
    'Status': solic.status,
    'Faturamento': solic.faturamento,
    'Técnico': solic.tecnicoNome,
    'CPF do Técnico': solic.tecnicoCPF,
    'Telefone do Técnico': solic.tecnicoTelefone,
    'Empresa do Técnico': solic.tecnicoEmpresa,
    'Observações': solic.observacoes,
  }));

  // Criar workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Solicitações');

  // Ajustar largura das colunas
  const columnWidths = [
    { wch: 4 },   // #
    { wch: 10 },  // ID
    { wch: 25 },  // Nome da Atividade
    { wch: 15 },  // Projeto
    { wch: 15 },  // Serviço
    { wch: 15 },  // Operadora
    { wch: 15 },  // Ticket Freshdesk
    { wch: 15 },  // Contato Local
    { wch: 30 },  // Endereço
    { wch: 12 },  // CEP
    { wch: 15 },  // Data da Atividade
    { wch: 15 },  // Hora da Atividade
    { wch: 15 },  // Data de Criação
    { wch: 15 },  // Data de Conclusão
    { wch: 15 },  // Status
    { wch: 12 },  // Faturamento
    { wch: 20 },  // Técnico
    { wch: 15 },  // CPF do Técnico
    { wch: 15 },  // Telefone do Técnico
    { wch: 20 },  // Empresa do Técnico
    { wch: 30 },  // Observações
  ];
  worksheet['!cols'] = columnWidths;

  // Formatar header (primeira linha)
  const headerStyle = {
    fill: { fgColor: { rgb: 'FF4472C4' } }, // Azul
    font: { bold: true, color: { rgb: 'FFFFFFFF' } }, // Branco
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  };

  // Aplicar estilo ao header
  if (excelData.length > 0) {
    const headerKeys = Object.keys(excelData[0]);
    for (let i = 0; i < headerKeys.length; i++) {
      const cellRef = XLSX.utils.encode_col(i) + '1';
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = headerStyle;
      }
    }
  }

  // Congelar primeira linha
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 };

  // Gerar buffer
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  return buffer;
}

export function generateFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `solicitacoes_${year}-${month}-${day}_${hours}-${minutes}-${seconds}.xlsx`;
}
