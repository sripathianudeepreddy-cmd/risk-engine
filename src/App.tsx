import { useState } from 'react';
import { ShieldAlert, Terminal, Activity, Lock, AlertCircle, RotateCcw, Cpu, TrendingUp, Briefcase } from 'lucide-react';
import type { AuditResult } from '@/lib/types';
import { auditStrategy } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuditReport } from '@/components/AuditReport';
import { LiveCharts } from '@/components/LiveCharts';
import { MacroIntel } from '@/components/MacroIntel';

type Tab = 'audit' | 'charts' | 'macro';
type AppState = 'idle' | 'loading' | 'result' | 'error';

const EXAMPLE_STRATEGIES = [
  'Buy when RSI drops below 30, sell when it hits 70. Double position size after each loss to recover quickly.',
  'Short out-of-the-money calls on SPY every Monday for 0.5% premium. Roll if assigned.',
  'Pairs trade between AAPL and MSFT: go long the underperformer and short the outperformer when z-score exceeds 2.',
  'Grid trade BTC/USDT with 0.5% spacing and 3x leverage in a ranging market.',
];

const TABS: { id: Tab; label: string; icon: typeof ShieldAlert }[] = [
  { id: 'audit', label: 'Strategy Audit', icon: ShieldAlert },
  { id: 'charts', label: 'Live Charts', icon: TrendingUp },
  { id: 'macro', label: 'Macro Intel', icon: Briefcase },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('audit');
  const [strategy, setStrategy] = useState('');
  const [state, setState] = useState<AppState>('idle');
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleAudit = async () => {
    if (!strategy.trim() || state === 'loading') return;
    setState('loading');
    setError(null);
    setResult(null);
    try {
      const auditResult = await auditStrategy(strategy);
      setResult(auditResult);
      setState('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during the audit.');
      setState('error');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAudit();
    }
  };

  const loadExample = (ex: string) => {
    setStrategy(ex);
    setCharCount(ex.length);
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-slate-200 flex flex-col">
      {/* Top Status Bar */}
      <header className="border-b border-slate-800/60 bg-[#0f1620]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-bold tracking-wider uppercase text-slate-200">TRADE<span className="text-cyan-400">RISK</span></span>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden sm:inline">Auditor</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden sm:inline">AI Engine Online</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Cpu className="w-3 h-3" /> Groq · gpt-oss-120b
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Terminal className="w-3 h-3" /> v3.0
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Secure
            </span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="border-b border-slate-800/60 bg-[#0f1620]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-3 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                  tab === id
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {tab === 'audit' && (
          <>
            {/* Hero */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 mb-4">
                <Activity className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">Adversarial Risk Intelligence</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                Audit Your Trading Strategy
                <span className="block text-cyan-400 text-glow-cyan">Before the Market Does</span>
              </h1>
              <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
                Describe your strategy in plain English. Three AI agents — a Strategy Parser, Stress Tester,
                and Fix Generator — analyze it in real time to find the weakness before it costs you capital.
              </p>
            </div>

            {/* Input Panel */}
            <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] overflow-hidden">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/40 bg-[#0a0e14]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 ml-2">strategy_input.txt</span>
                </div>
                <span className="text-[10px] tabular-nums text-slate-600">{charCount} chars</span>
              </div>

              {/* Text area */}
              <div className="p-4">
                <label htmlFor="strategy" className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Enter Trading Strategy in Plain English
                </label>
                <textarea
                  id="strategy"
                  value={strategy}
                  onChange={(e) => {
                    setStrategy(e.target.value);
                    setCharCount(e.target.value.length);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. Buy when RSI drops below 30, sell when it hits 70. Double position size after each loss to recover quickly..."
                  className="w-full h-36 bg-[#0a0e14] border border-slate-700/40 rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none scrollbar-thin font-mono leading-relaxed transition-colors"
                  maxLength={5000}
                />

                {/* Example chips */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-600 self-center mr-1">Try:</span>
                  {EXAMPLE_STRATEGIES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => loadExample(ex)}
                      className="text-[10px] px-2.5 py-1 rounded-full border border-slate-700/40 bg-[#0a0e14] text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400 transition-colors truncate max-w-[200px]"
                      title={ex}
                    >
                      {ex.length > 40 ? ex.slice(0, 40) + '...' : ex}
                    </button>
                  ))}
                </div>

                {/* Action row */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-slate-600">
                    <Cpu className="w-3 h-3" />
                    <span>3 AI agents · Groq inference</span>
                    <span className="hidden sm:inline">· Press ⌘+Enter to run</span>
                  </div>
                  <button
                    onClick={handleAudit}
                    disabled={!strategy.trim() || state === 'loading'}
                    className="group flex items-center gap-2 px-6 py-2.5 rounded-lg bg-cyan-500 text-[#0a0e14] font-bold text-sm uppercase tracking-wider hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Audit Strategy
                  </button>
                </div>
              </div>
            </div>

            {/* Output Area */}
            <div className="mt-6">
              {state === 'idle' && (
                <div className="rounded-xl border border-slate-800/40 bg-[#0f1620]/50 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border border-slate-700/40 flex items-center justify-center">
                    <ShieldAlert className="w-7 h-7 text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 uppercase tracking-widest">Awaiting strategy input</p>
                  <p className="text-xs text-slate-600 mt-1">AI audit results will appear here</p>
                </div>
              )}
              {state === 'loading' && <LoadingSpinner />}
              {state === 'error' && error && (
                <div className="rounded-xl border border-red-500/30 bg-[#0f1620] p-8 text-center animate-fade-in-up">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest text-red-400 mb-2">Audit Failed</p>
                  <p className="text-sm text-slate-400 max-w-md mx-auto mb-5">{error}</p>
                  <button
                    onClick={handleAudit}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-slate-600/40 bg-slate-800/40 text-slate-300 text-xs font-semibold uppercase tracking-wider hover:border-cyan-500/40 hover:text-cyan-400 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Audit
                  </button>
                </div>
              )}
              {state === 'result' && result && <AuditReport result={result} />}
            </div>
          </>
        )}

        {tab === 'charts' && <LiveCharts />}
        {tab === 'macro' && <MacroIntel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 bg-[#0f1620]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-600">
          <span>TRADE<span className="text-cyan-400/60">RISK</span> Auditor · Powered by CrewAI-style Multi-Agent AI</span>
          <span className="hidden sm:inline">For demonstration only · Not financial advice</span>
        </div>
      </footer>
    </div>
  );
}
