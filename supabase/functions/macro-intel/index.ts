// Macro Intelligence Edge Function
// Scrapes Yahoo Finance RSS headlines, then uses a Groq AI agent (gpt-oss-120b)
// to generate a 3-bullet "Morning Macro Briefing" from those headlines.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

// ── Fetch Groq API key (same pattern as audit-strategy) ──────────────────

let cachedApiKey: string | null = null;

async function getGroqApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  const envKey = Deno.env.get("GROQ_API_KEY");
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Unable to access secret store: missing Supabase credentials.");
  }

  const resp = await fetch(`${supabaseUrl}/rest/v1/app_secrets?key=eq.GROQ_API_KEY&select=value`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!resp.ok) {
    throw new Error("Unable to retrieve the Groq API key from the secret store.");
  }

  const rows = await resp.json();
  if (!Array.isArray(rows) || rows.length === 0 || !rows[0].value) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  cachedApiKey = rows[0].value;
  return cachedApiKey;
}

// ── Fetch headlines from Yahoo Finance RSS ──────────────────────────────

interface NewsHeadline {
  title: string;
  link: string;
  pubDate: string;
  source: string;
}

async function fetchYahooHeadlines(): Promise<NewsHeadline[]> {
  const rssUrl = "https://finance.yahoo.com/rss/rss-topstories";

  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance RSS error: ${response.status}`);
  }

  const xml = await response.text();

  // Parse XML with regex (no DOM parser in Deno stdlib by default)
  const headlines: NewsHeadline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && headlines.length < 5) {
    const itemXml = match[1];

    const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      itemXml.match(/<title>(.*?)<\/title>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const dateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);

    if (titleMatch) {
      headlines.push({
        title: titleMatch[1].trim(),
        link: linkMatch ? linkMatch[1].trim() : "#",
        pubDate: dateMatch ? dateMatch[1].trim() : "",
        source: sourceMatch ? sourceMatch[1].trim() : "Yahoo Finance",
      });
    }
  }

  if (headlines.length === 0) {
    throw new Error("No headlines found in Yahoo Finance RSS feed.");
  }

  return headlines;
}

// ── Generate AI Macro Briefing via Groq ──────────────────────────────────

async function generateMacroBriefing(headlines: NewsHeadline[]): Promise<string> {
  const headlineText = headlines
    .map((h, i) => `${i + 1}. ${h.title}`)
    .join("\n");

  const systemPrompt = `You are the Chief Macro Strategist at a top-tier hedge fund. You analyze financial news headlines and distill them into a crisp, actionable Morning Macro Briefing for portfolio managers.

Your style is:
- Authoritative and concise
- Focused on market implications (rates, equities, crypto, commodities, FX)
- Forward-looking: what matters for today's session
- No fluff, no hedging — bold, specific calls`;

  const userPrompt = `Here are the top ${headlines.length} headlines from Yahoo Finance:

${headlineText}

Generate a Morning Macro Briefing with EXACTLY 3 bullet points. Each bullet should:
1. Identify the key theme or risk
2. State the market implication (which assets move, in what direction)
3. Be 2-3 sentences maximum

Format: Output ONLY the 3 bullets, each starting with "• ". No intro, no outro, no headers. Just the 3 bullets.`;

  const apiKey = await getGroqApiKey();

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Groq API error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMsg = errorJson?.error?.message || errorMsg;
    } catch {
      errorMsg = errorText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq API returned an empty response.");
  }
  return content.trim();
}

// ── Main handler ────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const headlines = await fetchYahooHeadlines();
    const briefing = await generateMacroBriefing(headlines);

    return new Response(
      JSON.stringify({ briefing, headlines }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate macro intelligence.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
