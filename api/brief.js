export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  // ── Agent-specific system prompts ────────────────────────────────────────────
  // Each agent has a persona that shapes how they write their briefing.
  // These are injected when agent_id is passed from the frontend.
  const AGENT_PROMPTS = {
    robyn: `You are Robyn Castellanos, a senior NIGP-certified procurement consultant with 10 years of government procurement experience. Your specialty is NIGP best practice and forward-looking procurement strategy. Write in a direct, authoritative tone grounded in NIGP methodology, Texas procurement law, and NASPO cooperative purchasing standards. Cite specific statutes and frameworks by name. Write in flowing paragraphs like a strategy memo — no bullet points.`,
    bob:   `You are Bob Whitfield, a professional procurement analyst specializing in legal compliance and internal audit readiness. Your focus is identifying legal exposure and audit defensibility in government procurement. Write with a compliance-first perspective grounded in your jurisdiction's legal framework. Be precise about dollar thresholds and statutory requirements. Write in flowing paragraphs — no bullet points.`,
    mike:  `You are Mike Alvarez, a senior procurement analyst specializing in industry benchmarking. Your specialty is comparing agency spend patterns against government procurement industry norms. Identify where the agency is above or below typical performance benchmarks. Write in flowing paragraphs — no bullet points.`,
    chloe: `You are Chloe Okafor, a junior procurement analyst. Provide a clear, straightforward summary of the most obvious procurement patterns and concerns. Keep language accessible and actionable. Write in flowing paragraphs — no bullet points.`,
    christy: `You are Christy Park, a marketing designer specializing in executive presentation. Take the provided procurement analysis and reformat it for a board-ready executive and legislative audience. Use clear, compelling language. Organize for maximum executive impact — no bullet points, flowing paragraphs with strong section headers.`,
  };

  try {
    const { system, messages, ragContext, agent_id } = req.body;

    // ── Fetch RAG context if available ───────────────────────────────────────
    let knowledgeContext = "";

    if (ragContext?.queryText && process.env.SUPABASE_URL && process.env.OPENAI_API_KEY) {
      try {
        const ragRes = await fetch(
          `${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : "http://localhost:3000"}/api/rag-query`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queryText:    ragContext.queryText,
              jurisdiction: ragContext.jurisdiction || null,
              triggers:     ragContext.triggers     || [],
              matchCount:   5,
              agent_id:     agent_id || null,  // v3: scope RAG to this agent
            }),
          }
        );

        if (ragRes.ok) {
          const ragData = await ragRes.json();
          if (ragData.context) knowledgeContext = ragData.context;
        }
      } catch (ragErr) {
        console.error("RAG query failed (non-fatal):", ragErr.message);
      }
    }

    // ── Build system prompt ───────────────────────────────────────────────────
    // Priority: agent persona > passed system > base
    const agentPrompt = agent_id && AGENT_PROMPTS[agent_id] ? AGENT_PROMPTS[agent_id] : "";
    const baseSystem  = system || "";
    const promptCore  = agentPrompt || baseSystem;

    const enrichedSystem = knowledgeContext
      ? `${knowledgeContext}\n\n---\n\n${promptCore}`
      : promptCore;

    // ── Call Claude ───────────────────────────────────────────────────────────
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-haiku-4-5-20251001",
        max_tokens: 6000,
        system:     enrichedSystem,
        messages:   messages || [],
      }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch {
      return res.status(500).json({ error: "Anthropic returned: " + text.slice(0, 200) });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
