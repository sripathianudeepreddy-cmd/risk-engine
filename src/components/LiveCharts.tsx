import { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, createChart, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle } from 'lucide-react';
import type { MarketDataResponse, SymbolData } from '@/lib/types';
import { fetchMarketData } from '@/lib/api';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.toFixed(2);
}

function PriceHeader({ data }: { data: SymbolData }) {
  const isPositive = data.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const borderColor = isPositive ? 'border-green-500/30' : 'border-red-500/30';
  const bgColor = isPositive ? 'bg-green-500/5' : 'bg-red-500/5';

  return (
    <div className={`flex items-center justify-between rounded-lg border ${borderColor} ${bgColor} px-4 py-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg border ${borderColor} flex items-center justify-center`}>
          <TrendIcon className={`w-4 h-4 ${changeColor}`} />
        </div>
        <div>
          <div className="text-sm font-bold text-slate-200">{data.symbol}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">{data.name}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-lg font-bold tabular-nums text-slate-100">${formatPrice(data.currentPrice)}</div>
        <div className={`text-xs font-semibold tabular-nums ${changeColor}`}>
          {isPositive ? '+' : ''}{data.change} ({isPositive ? '+' : ''}{data.changePercent}%)
        </div>
      </div>
    </div>
  );
}

function ChartContainer({ data }: { data: SymbolData }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = createChart(chartRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#5a6b85',
        fontFamily: "'SF Mono', 'Fira Code', 'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(28, 38, 54, 0.3)' },
        horzLines: { color: 'rgba(28, 38, 54, 0.3)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: '#2a3a52', width: 1, labelBackgroundColor: '#0a0e14' },
        horzLine: { color: '#2a3a52', width: 1, labelBackgroundColor: '#0a0e14' },
      },
      rightPriceScale: {
        borderColor: 'rgba(28, 38, 54, 0.5)',
      },
      timeScale: {
        borderColor: 'rgba(28, 38, 54, 0.5)',
        timeVisible: false,
      },
      width: chartRef.current.clientWidth,
      height: 320,
    });

    chartApiRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff3b3b',
      borderUpColor: '#00e676',
      borderDownColor: '#ff3b3b',
      wickUpColor: '#00e676',
      wickDownColor: '#ff3b3b',
    });
    seriesRef.current = series;

    const chartData = data.candles.map((c) => ({
      time: c.time as import('lightweight-charts').Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    series.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current && chartApiRef.current) {
        chartApiRef.current.applyOptions({ width: chartRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  return <div ref={chartRef} className="w-full" />;
}

export function LiveCharts() {
  const [state, setState] = useState<LoadState>('idle');
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setState('loading');
    setError(null);
    try {
      const data = await fetchMarketData();
      setMarketData(data);
      setState('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load market data.');
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
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">Live Market Charts</h2>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest hidden sm:inline">· 1-Month Daily Candles</span>
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
            <span className="text-sm uppercase tracking-widest">Fetching market data...</span>
          </div>
        </div>
      )}

      {state === 'error' && error && (
        <div className="rounded-xl border border-red-500/30 bg-[#0f1620] p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-red-400 mb-2">Data Error</p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {state === 'ready' && marketData && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* BTC-USD Chart */}
          <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] overflow-hidden">
            <div className="p-4 border-b border-slate-700/30">
              <PriceHeader data={marketData.btc} />
            </div>
            <div className="p-2">
              <ChartContainer data={marketData.btc} />
            </div>
          </div>

          {/* SPY Chart */}
          <div className="rounded-xl border border-slate-700/40 bg-[#0f1620] overflow-hidden">
            <div className="p-4 border-b border-slate-700/30">
              <PriceHeader data={marketData.spy} />
            </div>
            <div className="p-2">
              <ChartContainer data={marketData.spy} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
