import { useEffect, useState } from 'react';
import { Newspaper, Briefcase, RefreshCw, AlertCircle, ExternalLink, Clock } from 'lucide-react';
import type { MacroIntelResponse } from '@/lib/types';
import { fetchMacroIntel } from '@/lib/api';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatPubDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

function BriefingCard({ briefing }: { briefing: string }) {
  const bullets = briefing
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .map((l) => l.replace(/^[•\-*]\s*/, ''));

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-[#0f1620] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-cyan-500/15 bg-cyan-500/5">
        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Morning Macro Briefing</h3>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest ml-auto">AI-Generated · gpt-oss-120b</span>
      </div>
      <div className="p-5 space-y-3">
        {bullets.map((bullet, i) => (
          <div
            key={i}
            className="flex items-start gap-3 animate-fade-in"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
            <p className="text-sm text-slate-300 leading-relaxed">{bullet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsFeed({ headlines }: { headlines: MacroIntelResponse['headlines'] }) {
  return (
    <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/30 bg-[#0a0e14]">
        <Newspaper className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300">Raw News Feed</h3>
        <span className="text-[10px] text-slate-600 uppercase tracking-widest ml-auto">Yahoo Finance RSS</span>
      </div>
      <div className="divide-y divide-slate-800/40">
        {headlines.map((h, i) => (
          <a
            key={i}
            href={h.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-5 py-4 hover:bg-slate-800/20 transition-colors group animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-cyan-500/40 font-mono text-xs mt-1 tabular-nums">
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-300 group-hover:text-cyan-400 transition-colors leading-snug">
                {h.title}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] text-slate-600 uppercase tracking-widest">{h.source}</span>
                {h.pubDate && (
                  <span className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock className="w-2.5 h-2.5" />
                    {formatPubDate(h.pubDate)}
                  </span>
                )}
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 mt-1 flex-shrink-0 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}

export function MacroIntel() {
  const [state, setState] = useState<LoadState>('idle');
  const [data, setData] = useState<MacroIntelResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setState('loading');
    setError(null);
    try {
      const result = await fetchMacroIntel();
      setData(result);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load macro intelligence.');
      setState('error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-4 animate-fade-in-up">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Macro Intelligence</h2>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden sm:inline">· AI Morning Briefing</span>
        </div>
        <button
          onClick={loadData}
          disabled={state === 'loading'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/40 bg-[#0f1620] text-slate-400 text-[10px] font-semibold uppercase tracking-wider hover:border-cyan-500/40 hover:text-cyan-400 disabled:opacity-40 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${state === 'loading' ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {state === 'loading' && (
        <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] p-16 text-center">
          <div className="inline-flex items-center gap-3 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            <span className="text-sm uppercase tracking-widest">Analyzing macro headlines...</span>
          </div>
        </div>
      )}

      {state === 'error' && error && (
        <div className="rounded-xl border border-red-500/30 bg-[#0f1620] p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-red-400 mb-2">Error</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {state === 'ready' && data && (
        <>
          <BriefingCard briefing={data.briefing} />
          <NewsFeed headlines={data.headlines} />
        </>
      )}
    </div>
  );
}
