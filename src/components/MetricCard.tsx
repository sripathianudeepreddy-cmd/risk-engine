interface Props {
  label: string;
  value: string;
  status?: 'critical' | 'high' | 'elevated' | 'moderate' | 'low' | 'normal';
}

const STATUS_COLORS: Record<string, string> = {
  critical: 'text-red-400 border-red-500/30',
  high: 'text-orange-400 border-orange-500/30',
  elevated: 'text-amber-400 border-amber-500/30',
  moderate: 'text-cyan-400 border-cyan-500/30',
  low: 'text-green-400 border-green-500/30',
  normal: 'text-slate-300 border-slate-600/40',
};

export function MetricCard({ label, value, status = 'normal' }: Props) {
  return (
    <div className={`rounded-lg border bg-[#0f1620] px-3 py-2.5 ${STATUS_COLORS[status]}`}>
      <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-bold tabular-nums">{value}</div>
    </div>
  );
}
