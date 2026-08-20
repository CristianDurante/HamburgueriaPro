import { getStoreConfig } from '../settings.js';

export function formatNumber(number) {
  return String(number || '').replace(/\D/g, '');
}

export function buildWaMeLink(number, message) {
  return `https://wa.me/${formatNumber(number)}?text=${encodeURIComponent(message)}`;
}

async function sendViaEvolution(config, to, message) {
  const url =
    (config.apiUrl || '').replace(/\/$/, '') +
    `/message/sendText/${config.apiInstance || 'default'}`;
  const token = config.apiToken;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { apikey: token } : {}),
    },
    body: JSON.stringify({
      number: to,
      text: message,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Evolution API ${res.status}: ${body.slice(0, 200)}`);
  }
  return { provider: 'evolution' };
}

async function sendViaZapi(config, to, message) {
  const url = `https://api.z-api.io/instances/${config.apiInstance}/token/${config.apiToken}/send-text`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'client-token': config.clientToken || '' },
    body: JSON.stringify({ phone: to, message }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Z-API ${res.status}: ${body.slice(0, 200)}`);
  }
  return { provider: 'zapi' };
}

async function sendViaTwilio(config, to, message) {
  const accountSid = config.apiAccountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = config.apiToken || process.env.TWILIO_AUTH_TOKEN;
  const from = config.apiFrom || process.env.TWILIO_FROM;
  if (!accountSid || !authToken || !from) {
    throw new Error('Credenciais Twilio não configuradas');
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: from,
    To: `whatsapp:${to}`,
    Body: message,
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
    },
    body,
  });
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Twilio ${res.status}: ${bodyText.slice(0, 200)}`);
  }
  return { provider: 'twilio' };
}

async function sendViaHttpApi(config, to, message) {
  const url = config.apiUrl;
  if (!url) throw new Error('URL da API de WhatsApp não configurada');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiToken ? { Authorization: `Bearer ${config.apiToken}` } : {}),
    },
    body: JSON.stringify({
      to,
      message,
      number: to,
      text: message,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP API ${res.status}: ${body.slice(0, 200)}`);
  }
  return { provider: 'http' };
}

const PROVIDERS = {
  'wa.me': async (config, to, message) => ({
    provider: 'wa.me',
    link: buildWaMeLink(to, message),
  }),
  evolution: sendViaEvolution,
  zapi: sendViaZapi,
  twilio: sendViaTwilio,
  http: sendViaHttpApi,
};

/**
 * Envia uma mensagem de pedido via WhatsApp.
 * Retorna { provider, link?, error? }.
 * O link wa.me é sempre retornado como fallback para o cliente
 * conseguir abrir a conversa mesmo quando a API falhar.
 */
export async function sendWhatsAppOrder(to, message) {
  const store = getStoreConfig();
  const rawNumber = formatNumber(to || store.whatsappNumber || store.whatsapp);
  const fallbackLink = buildWaMeLink(rawNumber, message);

  if (!rawNumber) {
    return { sent: false, link: fallbackLink, error: 'Número do WhatsApp não configurado' };
  }

  const providerName = store.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'wa.me';
  const provider = PROVIDERS[providerName] || PROVIDERS['wa.me'];

  const config = {
    apiUrl: store.whatsappApiUrl || process.env.EVOLUTION_URL || process.env.HTTP_API_URL || '',
    apiInstance: process.env.EVOLUTION_INSTANCE || process.env.ZAPI_INSTANCE_ID || '',
    apiToken:
      store.whatsappApiToken ||
      process.env.EVOLUTION_TOKEN ||
      process.env.ZAPI_CLIENT_TOKEN ||
      process.env.TWILIO_AUTH_TOKEN ||
      '',
    clientToken: process.env.ZAPI_CLIENT_TOKEN || '',
    apiAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    apiFrom: process.env.TWILIO_FROM || '',
  };

  try {
    const result = await provider(config, rawNumber, message);
    return { sent: true, provider: result.provider, link: fallbackLink, ...result };
  } catch (error) {
    console.error('[whatsapp] falha ao enviar:', error.message);
    return { sent: false, provider: providerName, link: fallbackLink, error: error.message };
  }
}

export function getProviderInfo() {
  const store = getStoreConfig();
  return {
    provider: store.whatsappProvider || process.env.WHATSAPP_PROVIDER || 'wa.me',
    configured: !!(store.whatsappApiToken || process.env.EVOLUTION_TOKEN),
    number: formatNumber(store.whatsappNumber || store.whatsapp),
  };
}
