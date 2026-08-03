import { Solicitacao, Tecnico } from '@/types';

export function gerarTextoSolicitacao(solic: Solicitacao, tecnico: Tecnico | null): string {
  const dataAtividade = solic.dataAtividade || 'N/A';
  const horaAtividade = solic.horaAtividade || 'N/A';
  const endereco = `${solic.rua}, ${solic.numero}, ${solic.bairro}, ${solic.cidade} - ${solic.uf}`;
  const tecnicoNome = tecnico?.tecNome || 'Não atribuído';
  const tecnicoTelefone = tecnico?.tecTelefone || 'N/A';

  return `
**SOLICITAÇÃO TÉCNICA**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **Atividade:** ${solic.nomeAtividade}
🏢 **Projeto:** ${solic.grupoProjeto}
🔧 **Serviço:** ${solic.servico}
📡 **Operadora:** ${solic.operadora}
🎫 **Ticket:** ${solic.freshdeskTicket}
📞 **Contato Local:** ${solic.contatoLocal}

📅 **Data:** ${dataAtividade}
⏰ **Hora:** ${horaAtividade}

📍 **Endereço:** ${endereco}

👨‍🔧 **Técnico:** ${tecnicoNome}
📱 **Telefone:** ${tecnicoTelefone}

Status: ${solic.status}
  `.trim();
}

export function gerarTextoLiberacao(solic: Solicitacao, tecnico: Tecnico | null): string {
  const dataAtividade = solic.dataAtividade || 'N/A';
  const horaAtividade = solic.horaAtividade || 'N/A';
  const horarioChegada = solic.horarioChegada || 'N/A';
  const horarioTermino = solic.horarioTermino || 'N/A';
  const tecnicoNome = tecnico?.tecNome || 'N/A';

  const totalHoras = solic.totalHorasTrabalhadas || '0h';

  return `
**LIBERAÇÃO DE ATIVIDADE**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Atividade concluída com sucesso!

🎫 **Ticket:** ${solic.freshdeskTicket}
👨‍🔧 **Técnico:** ${tecnicoNome}

📅 **Data Programada:** ${dataAtividade}
⏰ **Hora Programada:** ${horaAtividade}

🕐 **Horário de Chegada:** ${horarioChegada}
🕑 **Horário de Término:** ${horarioTermino}
⏱️ **Total de Horas:** ${totalHoras}

💰 **Faturamento:** ${solic.faturamento === 'pago' ? '✅ Pago' : '❌ Não Pago'}

📝 **Observações:** ${solic.observacoes || 'Nenhuma'}
  `.trim();
}

export function copiarParaClipboard(texto: string): Promise<void> {
  return navigator.clipboard.writeText(texto);
}

export function enviarParaWhatsApp(numero: string, texto: string): string {
  const textoCodificado = encodeURIComponent(texto);
  return `https://wa.me/${numero}?text=${textoCodificado}`;
}

export function formatarNumeroWhatsApp(telefone: string): string {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  if (telefoneLimpo.length === 11) {
    return `55${telefoneLimpo}`;
  }
  return `55${telefoneLimpo}`;
}
