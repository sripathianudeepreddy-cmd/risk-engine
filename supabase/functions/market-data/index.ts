// Market Data Edge Function — fetches OHLC candlestick data from Yahoo Finance
// Returns 1-month daily candles for BTC-USD and SPY

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SymbolData {
  symbol: string;
  name: string;
  candles: Candle[];
  currentPrice: number;
  change: number;
  changePercent: number;
}

async function fetchYahooData(symbol: string, name: string): Promise<SymbolData> {
  const period = "1mo";
  const interval = "1d";

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${Math.floor(
    Date.now() / 1000 - 30 * 24 * 60 * 60,
  )}&period2=${Math.floor(Date.now() / 1000)}&interval=${interval}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance API error for ${symbol}: ${response.status}`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No data returned for ${symbol}`);
  }

  const timestamps: number[] = result.timestamp || [];
  const quote = result.indicators?.quote?.[0];
  if (!quote) {
    throw new Error(`No quote data for ${symbol}`);
  }

  const candles: Candle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    if (
      quote.open?.[i] == null ||
      quote.high?.[i] == null ||
      quote.low?.[i] == null ||
      quote.close?.[i] == null
    ) {
      continue;
    }
    candles.push({
      time: new Date(timestamps[i] * 1000).toISOString().slice(0, 10),
      open: Math.round(quote.open[i] * 100) / 100,
      high: Math.round(quote.high[i] * 100) / 100,
      low: Math.round(quote.low[i] * 100) / 100,
      close: Math.round(quote.close[i] * 100) / 100,
      volume: Math.round(quote.volume?.[i] || 0),
    });
  }

  const meta = result.meta;
  const currentPrice = meta?.regularMarketPrice || candles[candles.length - 1]?.close || 0;
  const prevClose = meta?.chartPreviousClose || meta?.previousClose || candles[0]?.open || 0;
  const change = Math.round((currentPrice - prevClose) * 100) / 100;
  const changePercent = Math.round(((change / prevClose) * 100) * 100) / 100;

  return {
    symbol,
    name,
    candles,
    currentPrice,
    change,
    changePercent,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const [btcData, spyData] = await Promise.all([
      fetchYahooData("BTC-USD", "Bitcoin / USD"),
      fetchYahooData("SPY", "SPDR S&P 500 ETF"),
    ]);

    return new Response(
      JSON.stringify({ btc: btcData, spy: spyData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch market data.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
