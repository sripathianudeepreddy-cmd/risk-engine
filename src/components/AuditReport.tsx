import { Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import type { AuditResult } from '@/lib/types';
import { getScoreColor, getScoreLabel } from '@/lib/types';
import { AnimatedScore } from './AnimatedScore';
import { MetricCard } from './MetricCard';

interface Props {
  result: AuditResult;
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  critical: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  high: { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  medium: { dot: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  low: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/10' },
};

const GLOW_CLASSES: Record<string, string> = {
  red: 'text-red-400 text-glow-red',
  amber: 'text-amber-400 text-glow-amber',
  cyan: 'text-cyan-400 text-glow-cyan',
  green: 'text-green-400 text-glow-green',
};

const RING_CLASSES: Record<string, string> = {
  red: 'border-red-500/40 shadow-[0_0_60px_-12px_rgba(255,59,59,0.3)]',
  amber: 'border-amber-500/40 shadow-[0_0_60px_-12px_rgba(255,184,0,0.3)]',
  cyan: 'border-cyan-500/40 shadow-[0_0_60px_-12px_rgba(0,212,255,0.3)]',
  green: 'border-green-500/40 shadow-[0_0_60px_-12px_rgba(0,230,118,0.3)]',
};

const BAR_COLOR: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  cyan: 'bg-cyan-500',
  green: 'bg-green-500',
};

export function AuditReport({ result }: Props) {
  const colorKey = getScoreColor(result.trustScore);
  const scoreLabel = getScoreLabel(result.trustScore);
  const glow = GLOW_CLASSES[colorKey];
  const ring = RING_CLASSES[colorKey];
  const bar = BAR_COLOR[colorKey];

  return (
    <div className="animate-fade-in-up space-y-4">
      {/* Trust Score Hero */}
      <div className={`relative overflow-hidden rounded-xl border bg-[#0f1620] p-6 ${ring}`}>
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 text-center md:text-left">
              Adversarial Trust Score
            </div>
            <div className="flex items-baseline justify-center md:justify-start">
              <AnimatedScore
                target={result.trustScore}
                duration={1200}
                className={`text-7xl md:text-8xl font-black tabular-nums leading-none ${glow}`}
              />
              <span className="text-2xl text-slate-600 font-bold ml-1">/100</span>
            </div>
            <div className={`text-center md:text-left mt-2 text-sm font-bold tracking-widest uppercase ${glow}`}>
              {scoreLabel}
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className={`w-4 h-4 ${glow}`} />
              <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                Risk Level: {result.riskLevel}
              </span>
            </div>
            {/* Score bar */}
            <div className="relative h-2 bg-[#1c2636] rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${bar} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${result.trustScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-slate-600 tabular-nums">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <MetricCard label="Max Drawdown" value={result.metrics.maxDrawdown} status="normal" />
              <MetricCard label="Sharpe Ratio" value={result.metrics.sharpeRatio} status="normal" />
              <MetricCard label="Win Rate" value={result.metrics.winRate} status="normal" />
              <MetricCard label="Volatility" value={result.metrics.volatility} status="normal" />
              <MetricCard label="Correlation Risk" value={result.metrics.correlationRisk} status="normal" />
              <MetricCard label="Liquidity Risk" value={result.metrics.liquidityRisk} status="normal" />
            </div>
          </div>
        </div>
      </div>

      {/* Root Cause & Actionable Fix */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-500/20 bg-[#0f1620] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-red-400">Root Cause of Failure</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.rootCause}</p>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-[#0f1620] p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-green-400">Actionable Fix</h3>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{result.actionableFix}</p>
        </div>
      </div>

      {/* Vulnerabilities */}
      <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Vulnerability Breakdown</h3>
        </div>
        <div className="space-y-2">
          {result.vulnerabilities.map((v, i) => {
            const s = SEVERITY_STYLES[v.severity] || SEVERITY_STYLES.low;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border border-slate-700/30 px-4 py-3 ${s.bg} animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">{v.label}</span>
                    <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${s.text} ${s.bg}`}>
                      {v.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure Scenarios */}
      <div className="rounded-xl border border-amber-500/20 bg-[#0f1620] p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-amber-400">Simulated Failure Scenarios</h3>
        </div>
        <div className="space-y-2">
          {result.failureScenarios.map((scenario, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg bg-[#0a0e14] border border-slate-700/20 px-4 py-3 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <span className="text-amber-500/60 font-mono text-xs mt-0.5 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm text-slate-400 leading-relaxed">{scenario}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-center text-[10px] text-slate-600 uppercase tracking-widest pt-1">
        Audit completed at {new Date(result.timestamp).toLocaleTimeString('en-US', { hour12: false })} · AI adversarial engine v3.0 · Groq gpt-oss-120b
      </div>
    </div>
  );
}
