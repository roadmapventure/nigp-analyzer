export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const { system, messages, ragContext } = req.body;

    // ── Step 1: Fetch RAG context if spend summary is available ───────────
    // ragContext is passed from the frontend: { queryText, jurisdiction, triggers }
    // If Supabase isn't configured yet or RAG fails, we fall back gracefully
    let knowledgeContext = "";

    if (ragContext?.queryText && process.env.SUPABASE_URL && process.env.OPENAI_API_KEY) {
      try {
        // Call rag-query as an internal fetch using Vercel's internal URL pattern
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
            }),
          }
        );

        if (ragRes.ok) {
          const ragData = await ragRes.json();
          if (ragData.context) {
            knowledgeContext = ragData.context;
          }
        }
        // RAG failure is non-fatal — briefing continues without it
      } catch (ragErr) {
        console.error("RAG query failed (non-fatal):", ragErr.message);
      }
    }

    // ── Step 2: Build enriched system prompt ──────────────────────────────
    const baseSystem = system || "";
    const enrichedSystem = knowledgeContext
      ? `${knowledgeContext}\n\n---\n\n${baseSystem}`
      : baseSystem;

    // ── Step 3: Call Claude ───────────────────────────────────────────────
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 6000,
        system: enrichedSystem,
        messages: messages || [],
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
