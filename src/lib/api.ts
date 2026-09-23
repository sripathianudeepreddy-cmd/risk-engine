import type { AuditResult, MarketDataResponse, MacroIntelResponse } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function auditStrategy(strategy: string): Promise<AuditResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/audit-strategy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ strategy }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error ||
      (response.status === 504
        ? 'The audit timed out. The AI agents took too long to respond — please try again.'
        : response.status === 500
          ? 'The AI audit engine encountered an error. Please try again in a moment.'
          : `Audit failed (${response.status}). Please try again.`);
    throw new Error(message);
  }

  if (!data) {
    throw new Error('The audit engine returned an invalid response. Please try again.');
  }

  if (typeof data.trustScore !== 'number' || typeof data.rootCause !== 'string') {
    throw new Error('The audit engine returned incomplete results. Please try again.');
  }

  return data as AuditResult;
}

export async function fetchMarketData(): Promise<MarketDataResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/market-data`, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Failed to fetch market data (${response.status}).`;
    throw new Error(message);
  }

  if (!data || !data.btc || !data.spy) {
    throw new Error('Market data response was incomplete.');
  }

  return data as MarketDataResponse;
}

export async function fetchMacroIntel(): Promise<MacroIntelResponse> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/macro-intel`, {
    headers: {
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error || `Failed to fetch macro intelligence (${response.status}).`;
    throw new Error(message);
  }

  if (!data || !data.briefing || !data.headlines) {
    throw new Error('Macro intelligence response was incomplete.');
  }

  return data as MacroIntelResponse;
}
