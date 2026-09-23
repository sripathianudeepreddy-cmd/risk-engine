import { ShieldCheck, FileSearch, Activity, Zap } from 'lucide-react';

const AGENT_STEPS = [
  { icon: FileSearch, label: 'Agent 1: Strategy Parser', detail: 'Decomposing trading logic...' },
  { icon: Activity, label: 'Agent 2: Stress Tester', detail: 'Simulating market crash scenarios...' },
  { icon: Zap, label: 'Agent 3: Fix Generator', detail: 'Synthesizing actionable fixes...' },
];

export function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-slate-700/40" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin-slow" />
        <div className="absolute inset-3 rounded-full border-2 border-slate-700/30" />
        <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-cyan-400/60 animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '1.6s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-cyan-400/80 animate-pulse-slow" />
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
        </div>
      </div>

      <div className="text-sm uppercase tracking-[0.3em] text-cyan-400 font-bold mb-2 animate-pulse-slow">
        Running Multi-Agent Audit
      </div>
      <div className="text-xs text-slate-500 mb-8">
        Groq · gpt-oss-120b
      </div>

      {/* Agent progress steps */}
      <div className="space-y-3 w-full max-w-sm">
        {AGENT_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-slate-700/30 bg-[#0f1620] px-4 py-3 animate-fade-in"
              style={{ animationDelay: `${i * 600}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-300">{step.label}</div>
                <div className="text-[10px] text-slate-500">{step.detail}</div>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse-slow" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-cyan-400/60 animate-pulse-slow" style={{ animationDelay: '200ms' }} />
                <div className="w-1 h-1 rounded-full bg-cyan-400/30 animate-pulse-slow" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
