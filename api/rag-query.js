export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const openaiKey   = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!openaiKey)   return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  try {
    const {
      queryText,
      jurisdiction,
      triggers,
      matchCount = 5,
      tenant_id,    // ── multi-tenancy: retrieve entries for this tenant + global shared entries
    } = req.body;

    if (!queryText) {
      return res.status(400).json({ error: "queryText is required" });
    }

    // ── Step 1: Embed the incoming query ──────────────────────────────────
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: queryText,
      }),
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      return res.status(500).json({ error: "OpenAI embedding failed: " + err.slice(0, 200) });
    }

    const embeddingData = await embeddingRes.json();
    const queryEmbedding = embeddingData.data?.[0]?.embedding;

    if (!queryEmbedding) {
      return res.status(500).json({ error: "No embedding returned from OpenAI" });
    }

    // ── Step 2: Call Supabase match_knowledge RPC ─────────────────────────
    // The RPC now accepts tenant_id and returns entries matching:
    //   - tenant_id = "global" (shared across all users), OR
    //   - tenant_id = the caller's specific tenant
    // This means every user always sees global entries + their own private entries.
    // When tenant_id is omitted or "global", only global entries are returned.
    const effectiveTenant = tenant_id || "global";

    const rpcRes = await fetch(`${supabaseUrl}/rest/v1/rpc/match_knowledge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        query_embedding: queryEmbedding,
        match_threshold: 0.3,
        match_count:     matchCount,
        p_tenant_id:     effectiveTenant,
      }),
    });

    if (!rpcRes.ok) {
      const err = await rpcRes.text();
      return res.status(500).json({ error: "Supabase RPC failed: " + err.slice(0, 200) });
    }

    const matches = await rpcRes.json();

    // ── Step 3: Format matches into injected context text ─────────────────
    if (!matches || matches.length === 0) {
      return res.status(200).json({ context: "", matchCount: 0, entries: [] });
    }

    // Prefer entries matching the agency's jurisdiction (or "All")
    const jurisdictionFiltered = matches.filter(m =>
      !jurisdiction ||
      m.jurisdiction === "All" ||
      m.jurisdiction === jurisdiction
    );

    const finalMatches = jurisdictionFiltered.length > 0 ? jurisdictionFiltered : matches;

    // Build the context block Claude will receive
    const contextLines = finalMatches.map(m => {
      const jurisdictionTag = m.jurisdiction !== "All"
        ? `[JURISDICTION: ${m.jurisdiction}] `
        : "";
      const priorityTag = m.priority >= 80
        ? "[CRITICAL PRIORITY] "
        : m.priority >= 65
        ? "[HIGH PRIORITY] "
        : m.priority >= 40
        ? "[MEDIUM PRIORITY] "
        : "[LOW PRIORITY] ";

      return `--- KNOWLEDGE BASE ENTRY: ${m.title} ---\n${jurisdictionTag}${priorityTag}\n${m.content}`;
    });

    const context = `The following NIGP knowledge base entries are relevant to this analysis. Apply them when generating recommendations:\n\n${contextLines.join("\n\n")}`;

    return res.status(200).json({
      context,
      matchCount: finalMatches.length,
      entries: finalMatches.map(m => ({
        id:         m.id,
        title:      m.title,
        similarity: m.similarity,
        tenant_id:  m.tenant_id,
      })),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
