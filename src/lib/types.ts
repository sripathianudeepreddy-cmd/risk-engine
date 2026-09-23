export interface AuditResult {
  trustScore: number;
  riskLevel: string;
  rootCause: string;
  actionableFix: string;
  failureScenarios: string[];
  metrics: {
    maxDrawdown: string;
    sharpeRatio: string;
    winRate: string;
    volatility: string;
    correlationRisk: string;
    liquidityRisk: string;
  };
  vulnerabilities: { label: string; severity: 'critical' | 'high' | 'medium' | 'low'; description: string }[];
  timestamp: string;
}

export function getScoreColor(score: number): string {
  if (score < 40) return 'red';
  if (score < 60) return 'amber';
  if (score < 75) return 'cyan';
  return 'green';
}

export function getScoreLabel(score: number): string {
  if (score < 30) return 'CATASTROPHIC';
  if (score < 45) return 'CRITICAL';
  if (score < 60) return 'ELEVATED';
  if (score < 75) return 'MODERATE';
  if (score < 85) return 'ACCEPTABLE';
  return 'TRUSTED';
}

// ── Market Data types ────────────────────────────────────────────────────

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolData {
  symbol: string;
  name: string;
  candles: Candle[];
  currentPrice: number;
  change: number;
  changePercent: number;
}

export interface MarketDataResponse {
  btc: SymbolData;
  spy: SymbolData;
}

// ── Macro Intel types ────────────────────────────────────────────────────

export interface NewsHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

export interface MacroIntelResponse {
  briefing: string;
  headlines: NewsHeadline[];
}
