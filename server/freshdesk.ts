import { ENV } from './_core/env';

/**
 * Send a reply to a Freshdesk ticket
 * @param ticketId The Freshdesk ticket ID
 * @param message The message body (can be HTML or plain text)
 * @returns The response from Freshdesk API
 */
export async function responderTicketFreshdesk(ticketId: number, message: string) {
  let domain = (ENV.freshdeskDomain || 'gowifiassist').trim();
  const apiKey = (ENV.freshdeskApiKey || '').trim();

  // Extract domain from URL if it's a full URL (e.g., https://gowifiassist.freshdesk.com -> gowifiassist)
  if (domain.includes('://')) {
    const urlObj = new URL(domain);
    domain = urlObj.hostname?.split('.')[0] || domain;
  } else if (domain.includes('.')) {
    domain = domain.split('.')[0];
  }

  console.log('[Freshdesk] Domain:', domain);
  console.log('[Freshdesk] API Key configured:', !!apiKey);

  if (!apiKey) {
    throw new Error('FRESHDESK_API_KEY nao configurada');
  }

  if (!domain) {
    throw new Error('FRESHDESK_DOMAIN nao configurada');
  }

  // Freshdesk exige autenticação Basic com "api_key:X"
  const authHeader = Buffer.from(`${apiKey}:X`).toString('base64');

  // 1. Buscar detalhes do ticket para coletar os e-mails em cópia (cc_emails)
  let ccEmails: string[] = [];
  try {
    const ticketUrl = `https://${domain}.freshdesk.com/api/v2/tickets/${ticketId}`;
    console.log('[Freshdesk] Buscando dados do ticket para recuperar CCs:', ticketUrl);
    
    const ticketResponse = await fetch(ticketUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    if (ticketResponse.ok) {
      const ticketData = await ticketResponse.json();
      if (ticketData.cc_emails && Array.isArray(ticketData.cc_emails)) {
        ccEmails = ticketData.cc_emails;
        console.log('[Freshdesk] CCs encontrados no ticket:', ccEmails);
      }
    } else {
      console.warn('[Freshdesk] Não foi possível buscar os dados do ticket para recuperar CCs:', ticketResponse.status);
    }
  } catch (err) {
    console.error('[Freshdesk] Erro ao buscar CCs do ticket:', err);
  }

  const url = `https://${domain}.freshdesk.com/api/v2/tickets/${ticketId}/reply`;
  console.log('[Freshdesk] URL de resposta:', url);

  // Monta o payload incluindo os CCs caso existam
  const payload: any = {
    body: message,
  };

  if (ccEmails.length > 0) {
    payload.cc_emails = ccEmails;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro ao responder ticket Freshdesk:', errorData);
      throw new Error(`Erro Freshdesk: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log(`✅ Resposta enviada ao ticket #${ticketId} incluindo solicitante e cópias (CC)`);
    return data;
  } catch (err) {
    console.error('Erro na requisição Freshdesk:', err);
    throw err;
  }
}

/**
 * Format the liberation text for Freshdesk (HTML format)
 */
export function formatarTextoLiberacaoFreshdesk(
  data: string,
  hora: string,
  tecnicoNome: string,
  tecnicoCpf: string
): string {
  // Format date from YYYY-MM-DD to DD/MM/YYYY
  let dataFormatada = data;
  if (data.includes('-')) {
    const [year, month, day] = data.split('-');
    dataFormatada = `${day}/${month}/${year}`;
  }
  
  // Format time from HH:MM:SS to HH:MM
  let horaFormatada = hora;
  if (hora.includes(':')) {
    const [hh, mm] = hora.split(':');
    horaFormatada = `${hh}:${mm}`;
  }
  
  return `Prezados,<br/><br/>Atividade agendada para dia ${dataFormatada} às ${horaFormatada}<br/><br/>Segue os dados do técnico para a liberação:<br/><br/>Nome: ${tecnicoNome}<br/>CPF: ${tecnicoCpf}`;
}