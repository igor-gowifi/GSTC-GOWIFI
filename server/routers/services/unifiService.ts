import axios, { AxiosInstance } from 'axios';

const UNIFI_BASE_URL = process.env.UNIFI_BASE_URL || 'https://uos.gowifi.com.br:8443';
const UNIFI_API_KEY = process.env.UNIFI_API_KEY; // Lido diretamente do .env
const DEFAULT_SITE = 'zll6zc7d'; // Site: Bradesco AG Varejo

const NETWORK_NATIVA_ID = '6aa851b502688ed35cd98034';
const NETWORK_GERENCIA_ID = '6aa8526702688ed35cd980e7';

class UnifiService {
  private apiV1: AxiosInstance;
  private apiV2: AxiosInstance;

  constructor() {
    this.apiV1 = axios.create({
      baseURL: `${UNIFI_BASE_URL}/proxy/network/api`,
      headers: {
        'x-api-key': UNIFI_API_KEY,
        'Accept': 'application/javascript',
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    });

    this.apiV2 = axios.create({
      baseURL: `${UNIFI_BASE_URL}/proxy/network/v2/api`,
      headers: {
        'x-api-key': UNIFI_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    });
  }

  async listDevices(site: string = DEFAULT_SITE) {
    const response = await this.apiV1.get(`/s/${site}/stat/device`);
    return response.data.data;
  }

  async renameDevice(deviceId: string, name: string, site: string = DEFAULT_SITE) {
    const response = await this.apiV1.put(`/s/${site}/rest/device/${deviceId}`, { name });
    return response.data;
  }

  async getApGroups(site: string = DEFAULT_SITE) {
    const response = await this.apiV2.get(`/site/${site}/apgroups`);
    return response.data;
  }

  async createApGroup(groupName: string, deviceMacs: string[], site: string = DEFAULT_SITE) {
    const response = await this.apiV2.post(`/site/${site}/apgroups`, {
      name: groupName,
      device_macs: deviceMacs.map(m => m.toLowerCase()),
    });
    return response.data;
  }

  async createWlan(payload: {
    name: string;
    passphrase: string;
    networkconf_id: string;
    ap_group_ids: string[];
  }, site: string = DEFAULT_SITE) {
    const response = await this.apiV1.post(`/s/${site}/rest/wlanconf`, {
      name: payload.name,
      security: 'wpapsk',
      x_passphrase: payload.passphrase,
      wpa_mode: 'wpa2',
      wpa_enc: 'ccmp',
      enabled: true,
      networkconf_id: payload.networkconf_id,
      ap_group_mode: 'groups',
      ap_group_ids: payload.ap_group_ids,
    });
    return response.data;
  }

  /**
   * FLUXO DE PROVISIONAMENTO COM REGRAS DE NOMENCLATURA E MÚLTIPLOS APs
   */
  async provisionAgency(payload: {
    agencia: string;
    nomeFormatado: string; // Ex: 1234_SP_CENTRO
    macs: string[];
  }, site: string = DEFAULT_SITE) {
    const { agencia, nomeFormatado, macs } = payload;
    const groupName = `ag_${agencia.trim()}`;
    const logs: string[] = [];

    logs.push(`🚀 Iniciando provisionamento da Agência ${agencia} (${nomeFormatado})...`);

    // 1. Verificar/Criar AP Group contendo TODOS os MACs
    const existingGroups = await this.getApGroups(site);
    let apGroup = existingGroups.find((g: any) => g.name.toLowerCase() === groupName.toLowerCase());

    if (!apGroup) {
      logs.push(`➕ Criando AP Group '${groupName}' com ${macs.length} AP(s)...`);
      apGroup = await this.createApGroup(groupName, macs, site);
      logs.push(`✅ AP Group '${groupName}' criado com sucesso! (ID: ${apGroup._id})`);
    } else {
      logs.push(`ℹ️ AP Group '${groupName}' já existe (ID: ${apGroup._id}). Reutilizando.`);
    }

    const apGroupId = apGroup._id;

    // 2. Localizar e Nomear cada AP sequencialmente
    const devices = await this.listDevices(site);
    const totalAps = macs.length;

    for (let index = 0; index < totalAps; index++) {
      const mac = macs[index];
      const cleanMac = mac.toLowerCase().replace(/[:-]/g, '');
      const device = devices.find((d: any) => d.mac.replace(/[:-]/g, '') === cleanMac);

      // Regra de Nomenclatura do AP:
      // Se tiver mais de 1 AP: XXXX_UF_NOME AP01, XXXX_UF_NOME AP02
      // Se for apenas 1 AP: XXXX_UF_NOME
      const sufixo = totalAps > 1 ? ` AP${String(index + 1).padStart(2, '0')}` : '';
      const apName = `${nomeFormatado.trim()}${sufixo}`;

      if (device) {
        logs.push(`🏷️ Nomeando AP [${mac}] para '${apName}'...`);
        await this.renameDevice(device._id, apName, site);
      } else {
        logs.push(`⚠️ AP com MAC [${mac}] não está online na controller no momento. (Nome reservado: '${apName}')`);
      }
    }

    // 3. Criar SSID Principal (Nativa)
    const ssidPrincipalName = `${agencia}_Bradesco`;
    logs.push(`📡 Criando SSID Principal '${ssidPrincipalName}'...`);
    await this.createWlan({
      name: ssidPrincipalName,
      passphrase: `${agencia}_Bradesco`,
      networkconf_id: NETWORK_NATIVA_ID,
      ap_group_ids: [apGroupId],
    }, site);
    logs.push(`✅ SSID Principal '${ssidPrincipalName}' criado!`);

    // 4. Criar SSID Gerência (VLAN 100)
    const ssidGerenciaName = `${agencia} Gerencia`;
    logs.push(`📡 Criando SSID Gerência '${ssidGerenciaName}'...`);
    await this.createWlan({
      name: ssidGerenciaName,
      passphrase: 'GerenciaBr@desc0',
      networkconf_id: NETWORK_GERENCIA_ID,
      ap_group_ids: [apGroupId],
    }, site);
    logs.push(`✅ SSID Gerência '${ssidGerenciaName}' criado!`);

    return { success: true, logs };
  }
}

export const unifiService = new UnifiService();