// Trading Risk Auditor — CrewAI-style multi-agent edge function (v3.1)
//
// Replicates a CrewAI crew of 3 agents, each with role/goal/backstory/task,
// running sequentially via Groq's chat completions API (openai/gpt-oss-120b).
//
// Agent 1: Strategy Parser    — converts plain English → structured trading logic
// Agent 2: Stress Tester       — tests strategy against market crashes, outputs Trust Score
// Agent 3: Fix Generator       — provides actionable fixes
//
// Each agent receives the previous agent's output as context (crew handoff).
// The final response is a JSON object matching the frontend's AuditResult interface.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

// ── Fetch the Groq API key from the database ──────────────────────────────

let cachedApiKey: string | null = null;

async function getGroqApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  // Try environment variable first (set via Supabase dashboard secrets)
  const envKey = Deno.env.get("GROQ_API_KEY");
  if (envKey) {
    cachedApiKey = envKey;
    return envKey;
  }

  // Fall back to database (app_secrets table, readable only via service_role)
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
    throw new Error(
      "GROQ_API_KEY is not configured. Please add it in the Supabase Dashboard under Edge Function secrets, or contact the administrator.",
    );
  }

  cachedApiKey = rows[0].value;
  return cachedApiKey;
}

// ── Agent definitions (mirrors CrewAI Agent config) ──────────────────────

interface AgentDef {
  role: string;
  goal: string;
  backstory: string;
  task: (input: string, priorOutput?: string) => string;
}

const AGENTS: Record<string, AgentDef> = {
  parser: {
    role: "Strategy Parser",
    goal:
      "Convert a plain-English trading strategy description into a precise, structured representation of its trading logic, risk parameters, and market assumptions.",
    backstory:
      "You are a veteran quantitative analyst who has spent 15 years decomposing discretionary trader descriptions into formal algorithmic specifications. You can identify hidden assumptions, implicit risk parameters, and logical flaws that the strategy author is unaware of. You think in terms of entry/exit rules, position sizing, market regime assumptions, and edge decay.",
    task: (input) => `Analyze the following trading strategy described in plain English:

"""
${input}
"""

Decompose it into a structured specification. Identify:
1. Entry and exit rules
2. Position sizing logic (explicit or implied)
3. Market regime assumptions (trending, ranging, volatile, calm)
4. Hidden assumptions the author may not realize they are making
5. Any logical flaws or contradictions in the strategy design
6. Risk management mechanisms (or lack thereof)
7. Expected edge and its likely source

Be precise and critical. If the strategy is vague, state the most likely interpretation and flag the ambiguity. Output a concise structured analysis (max 400 words).`,
  },

  stressTester: {
    role: "Stress Tester",
    goal:
      "Stress-test the parsed strategy against extreme market scenarios and historical crash conditions, then assign an Adversarial Trust Score from 0 to 100.",
    backstory:
      "You are an adversarial risk engineer who has modeled every major market crash from 1987 Black Monday through the 2020 COVID crash and the 2022 rate-hike bear market. You think in tail risks, fat tails, correlation breakdowns, liquidity vacuums, and regime shifts. Your job is to find how a strategy FAILS, not how it succeeds. You are skeptical, thorough, and quantitative.",
    task: (_input, priorOutput) => `A structured analysis of a trading strategy has been produced by the Strategy Parser:

"""
${priorOutput}
"""

Your job is to stress-test this strategy. Simulate it mentally against these adversarial scenarios:
1. Flash crash (e.g., 2010 Flash Crash, 1987 Black Monday)
2. Volatility regime shift (VIX spikes from 15 to 40+)
3. Liquidity vacuum (bid-ask spreads widen 5-10x)
4. Correlation convergence (all assets move to 1.0 correlation)
5. Extended chop / whipsaw market
6. Gap risk (overnight or weekend gaps)
7. Black swan / idiosyncratic shock

For each scenario, determine: would this strategy survive, degrade, or catastrophically fail?

Then assign an **Adversarial Trust Score** from 0 to 100 where:
- 0-30: CATASTROPHIC — guaranteed to fail under stress
- 31-45: CRITICAL — severe tail risk, likely to fail
- 46-60: ELEVATED — significant weaknesses, moderate failure probability
- 61-75: MODERATE — some vulnerabilities but generally sound
- 76-85: ACCEPTABLE — minor weaknesses, robust under most scenarios
- 86-100: TRUSTED — resilient across adversarial scenarios

Also identify the single most critical **Root Cause of Failure** — the one structural weakness most likely to cause catastrophic loss.

Output your analysis as a JSON object with EXACTLY this structure (no markdown, no code fences, just raw JSON):
{
  "trustScore": <number 0-100>,
  "riskLevel": "<CRITICAL|HIGH|ELEVATED|MODERATE|LOW>",
  "rootCause": "<2-4 sentences explaining the primary structural weakness>",
  "failureScenarios": ["<scenario 1 description>", "<scenario 2>", "<scenario 3>", "<scenario 4>"],
  "metrics": {
    "maxDrawdown": "<estimated max drawdown as string, e.g. '-34.7%'>",
    "sharpeRatio": "<estimated Sharpe ratio as string>",
    "winRate": "<estimated win rate as string>",
    "volatility": "<estimated annualized volatility as string>",
    "correlationRisk": "<correlation risk assessment as string>",
    "liquidityRisk": "<LOW|MODERATE|ELEVATED|HIGH|CRITICAL>"
  },
  "vulnerabilities": [
    {"label": "<short name>", "severity": "<critical|high|medium|low>", "description": "<one sentence>"}
  ]
}`,
  },

  fixGenerator: {
    role: "Fix Generator",
    goal:
      "Given the stress test results and root cause, produce concrete, actionable fixes that a trader can implement immediately to address each vulnerability.",
    backstory:
      "You are a risk management consultant who has rescued dozens of trading desks from blow-ups. You specialize in translating risk analysis into specific, implementable fixes — not vague advice. Every fix you propose includes a parameter value, a mechanism, and an expected impact. You think in terms of circuit breakers, position sizing overlays, hedge legs, and regime filters.",
    task: (_input, priorOutput) => `A stress test has been completed on a trading strategy. Here is the result:

"""
${priorOutput}
"""

Based on the root cause and vulnerabilities identified, produce a single, comprehensive **Actionable Fix** — a detailed paragraph (3-6 sentences) with specific, implementable recommendations. Include:
- Specific parameter values (e.g., "cap position size at 1.5% NAV per trade")
- Specific mechanisms (e.g., "add a VIX-based circuit breaker that halts trading when VIX > 35")
- Expected impact of each fix
- Priority ordering (what to fix first)

Be concrete and professional. No generic advice like "manage your risk better." Every sentence must contain a specific, actionable recommendation.

Output ONLY the actionable fix text (no JSON, no markdown, no headers — just the paragraph).`,
  },
};

// ── Groq API call (single agent step) ────────────────────────────────────

async function runAgent(
  agent: AgentDef,
  userInput: string,
  priorOutput?: string,
): Promise<string> {
  const systemPrompt = `You are ${agent.role}.

Goal: ${agent.goal}

Background: ${agent.backstory}

You are part of a crew of AI agents auditing a trading strategy. Do your specific job with maximum rigor and expertise. Stay in character. Be concise but thorough.`;

  const userPrompt = agent.task(userInput, priorOutput);

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  };

  const apiKey = await getGroqApiKey();

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
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
    if (errorMsg.includes("blocked at the organization level")) {
      throw new Error(
        "The AI model is blocked in your Groq account settings. Please go to https://console.groq.com/settings/limits and enable the model 'openai/gpt-oss-120b' (or any available chat model), then try again.",
      );
    }
    if (errorMsg.includes("decommissioned") || errorMsg.includes("no longer supported")) {
      throw new Error(
        "The configured AI model has been retired by Groq. Please contact the administrator to update the model.",
      );
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

// ── Parse JSON from LLM output (handles code fences) ────────────────────

function extractJson(text: string): unknown {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```$/, "");
  }
  // Find the first { and last }
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Could not extract JSON from stress test output.");
  }
  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(cleaned);
}

// ── Main handler ────────────────────────────────────────────────────────

interface StressTestResult {
  trustScore: number;
  riskLevel: string;
  rootCause: string;
  failureScenarios: string[];
  metrics: {
    maxDrawdown: string;
    sharpeRatio: string;
    winRate: string;
    volatility: string;
    correlationRisk: string;
    liquidityRisk: string;
  };
  vulnerabilities: { label: string; severity: string; description: string }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { strategy } = await req.json();

    if (!strategy || typeof strategy !== "string" || strategy.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Strategy text is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (strategy.length > 5000) {
      return new Response(
        JSON.stringify({ error: "Strategy text exceeds the 5000 character limit." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Crew kickoff: sequential agent execution with handoff ──────────

    // Agent 1: Strategy Parser
    const parsedStrategy = await runAgent(AGENTS.parser, strategy);

    // Agent 2: Stress Tester (receives parser output)
    const stressTestRaw = await runAgent(AGENTS.stressTester, strategy, parsedStrategy);

    let stressTest: StressTestResult;
    try {
      stressTest = extractJson(stressTestRaw) as StressTestResult;
    } catch {
      // If JSON parsing fails, try a repair pass with a simpler prompt
      const repairResponse = await runAgent(
        {
          role: "JSON Formatter",
          goal: "Output valid JSON only.",
          backstory: "You are a JSON formatting assistant.",
          task: () => `Convert the following analysis into valid JSON with this exact structure:
{
  "trustScore": <number>,
  "riskLevel": "<CRITICAL|HIGH|ELEVATED|MODERATE|LOW>",
  "rootCause": "<string>",
  "failureScenarios": ["<string>"],
  "metrics": {
    "maxDrawdown": "<string>",
    "sharpeRatio": "<string>",
    "winRate": "<string>",
    "volatility": "<string>",
    "correlationRisk": "<string>",
    "liquidityRisk": "<string>"
  },
  "vulnerabilities": [{"label": "<string>", "severity": "<critical|high|medium|low>", "description": "<string>"}]
}

Analysis to convert:
"""
${stressTestRaw}
"""

Output ONLY the JSON object, no markdown, no explanation.`,
        },
        strategy,
        stressTestRaw,
      );
      stressTest = extractJson(repairResponse) as StressTestResult;
    }

    // Agent 3: Fix Generator (receives stress test output)
    const stressTestSummary = JSON.stringify(stressTest, null, 2);
    const actionableFix = await runAgent(AGENTS.fixGenerator, strategy, stressTestSummary);

    // ── Assemble final result matching frontend interface ──────────────

    const result = {
      trustScore: Math.max(0, Math.min(100, Math.round(stressTest.trustScore))),
      riskLevel: stressTest.riskLevel || "ELEVATED",
      rootCause: stressTest.rootCause || "Unable to determine root cause.",
      actionableFix: actionableFix || "Unable to generate fixes.",
      failureScenarios: Array.isArray(stressTest.failureScenarios)
        ? stressTest.failureScenarios.slice(0, 6)
        : ["Unable to generate failure scenarios."],
      metrics: {
        maxDrawdown: stressTest.metrics?.maxDrawdown || "N/A",
        sharpeRatio: stressTest.metrics?.sharpeRatio || "N/A",
        winRate: stressTest.metrics?.winRate || "N/A",
        volatility: stressTest.metrics?.volatility || "N/A",
        correlationRisk: stressTest.metrics?.correlationRisk || "N/A",
        liquidityRisk: stressTest.metrics?.liquidityRisk || "N/A",
      },
      vulnerabilities: Array.isArray(stressTest.vulnerabilities)
        ? stressTest.vulnerabilities
            .filter((v) => v && v.label && v.description)
            .slice(0, 8)
            .map((v) => ({
              label: v.label,
              severity: (["critical", "high", "medium", "low"].includes(v.severity)
                ? v.severity
                : "medium") as "critical" | "high" | "medium" | "low",
              description: v.description,
            }))
        : [],
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during the audit.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
