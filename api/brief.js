// api/brief.js
// Generates AI briefing with full 5-layer prompt assembly.
// Uses raw fetch only — no @anthropic-ai/sdk, no @supabase/supabase-js

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl  = process.env.SUPABASE_URL;
  const supabaseKey  = process.env.SUPABASE_SERVICE_KEY;

  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  const sbHeaders = {
    "Content-Type": "application/json",
    "apikey": supabaseKey || "",
    "Authorization": `Bearer ${supabaseKey || ""}`,
  };

  async function fetchConfig(agent_id, type, overrideId, tenant_id) {
    if (!supabaseUrl || !supabaseKey) return null;
    try {
      const url = overrideId
        ? `${supabaseUrl}/rest/v1/agent_configs?id=eq.${overrideId}&tenant_id=eq.${encodeURIComponent(tenant_id)}&select=text,name&limit=1`
        : `${supabaseUrl}/rest/v1/agent_configs?tenant_id=eq.${encodeURIComponent(tenant_id)}&agent_id=eq.${encodeURIComponent(agent_id)}&type=eq.${encodeURIComponent(type)}&is_default=eq.true&select=text,name&limit=1`;
      const r = await fetch(url, { method: "GET", headers: sbHeaders });
      if (!r.ok) return null;
      const rows = await r.json();
      return rows?.[0] || null;
    } catch { return null; }
  }

  const FALLBACK_ROLE = {
    chloe:   "You are Chloe Okafor, a junior government procurement analyst. Identify obvious spend patterns and flag clear anomalies. Keep analysis concise and direct.",
    mike:    "You are Mike Alvarez, a senior government procurement analyst with expertise in industry best practices. Provide detailed analysis grounded in procurement standards.",
    bob:     "You are Bob Whitfield, a professional government procurement analyst specializing in legal and compliance audits. Cite relevant statutes and standards. Write for Chief Procurement Officers.",
    robyn:   "You are Robyn Castellanos, an expert NIGP consultant and procurement strategist. Provide strategic, forward-looking analysis grounded in NIGP best practices.",
    christy: "You are Christy Park, a marketing designer. Format the provided analysis as a polished executive presentation with clear visual hierarchy.",
  };

  const FALLBACK_FORMAT = `Return a structured executive briefing with the following sections:\n1. Executive Summary (3-4 sentences, board-ready tone)\n2. Top Risk Findings (specific dollar amounts, vendor names where relevant)\n3. Compliance Flags (cite statute or standard where known)\n4. Recommended Actions (numbered, assign ownership)\n\nUse formal government procurement language. Write in flowing paragraphs, not bullet points. Format as clean HTML using only: <h2>, <h3>, <p>, <strong>. Do not add layout or page-level styles.`;

  const FALLBACK_GUARDRAIL = `NEVER:\n- Name a vendor as fraudulent or non-compliant without documented evidence\n- Provide legal conclusions — flag concerns and recommend legal review\n- Extrapolate beyond the data provided\n- Reference thresholds from jurisdictions other than the one configured\n\nALWAYS:\n- Cite the specific NIGP class when referencing commodity risk\n- Attribute dollar amounts to specific vendors or categories where the data supports it`;

  try {
    const {
      messages,
      system,
      agent_id,
      tenant_id = "global",
      role_prompt_id,
      output_format_id,
      ragContext,
      max_tokens = 6000,
      model = "claude-haiku-4-5-20251001",
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    let assembledSystem;
    let debugInfo = null;

    if (!agent_id || system) {
      // Legacy path — direct system prompt (AI Briefing tab)
      assembledSystem = system || "You are a senior government procurement analyst writing an executive briefing for a Chief Procurement Officer (CPO). Write in a direct, authoritative tone. Use precise numbers from the data. Structure your response in clean HTML using only: <h2>, <h3>, <p>, <strong>, <span style=\"...\">, <div style=\"...\">. Use colors: accent #b6873a, risk #a83319, warning #b8721a, text #28221a. Do not use bullet points. Write in flowing paragraphs like a McKinsey memo. IMPORTANT: Do not add any margin, padding, max-width, or width styles to any element. Do not wrap content in a body or html tag. Do not add page-level layout styles.";
    } else {
      // 5-layer assembly
      const roleConfig      = await fetchConfig(agent_id, "role_prompt",   role_prompt_id,   tenant_id);
      const formatConfig    = await fetchConfig(agent_id, "output_format",  output_format_id, tenant_id);
      const guardrailConfig = await fetchConfig(agent_id, "guardrail",      null,             tenant_id);

      const layer01 = roleConfig?.text      || FALLBACK_ROLE[agent_id] || FALLBACK_ROLE.mike;
      const layer04 = formatConfig?.text    || FALLBACK_FORMAT;
      const layer05 = guardrailConfig?.text || FALLBACK_GUARDRAIL;

      // Layer 02 — RAG context via internal rag-query call
      let layer02 = "";
      if (ragContext?.queryText && supabaseUrl) {
        try {
          const host = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000";
          const ragRes = await fetch(`${host}/api/rag-query`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              queryText:    ragContext.queryText,
              jurisdiction: ragContext.jurisdiction || "All",
              matchCount:   5,
              tenant_id,
              agent_id,
              triggers:     ragContext.triggers || [],
            }),
          });
          if (ragRes.ok) {
            const ragJson = await ragRes.json();
            if (ragJson.context) layer02 = ragJson.context;
          }
        } catch (e) { console.warn("[brief] RAG query failed:", e.message); }
      }

      const parts = [`=== ROLE & IDENTITY ===\n${layer01}`];
      if (layer02) parts.push(`=== BACKGROUND KNOWLEDGE ===\n${layer02}`);
      parts.push(`=== OUTPUT FORMAT ===\n${layer04}`);
      parts.push(`=== CONSTRAINTS & GUARDRAILS ===\n${layer05}`);
      assembledSystem = parts.join("\n\n---\n\n");

      debugInfo = {
        agent_id,
        role_name:        roleConfig?.name      || "fallback",
        format_name:      formatConfig?.name    || "fallback",
        guardrail_name:   guardrailConfig?.name || "fallback",
        rag_retrieved:    !!layer02,
        layers_assembled: layer02 ? 5 : 4,
      };
    }

    // Call Anthropic via raw fetch
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, system: assembledSystem, messages }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error("[brief] Anthropic error:", errText);
      return res.status(anthropicRes.status).json({ error: "Anthropic API error: " + errText.slice(0, 300) });
    }

    const result = await anthropicRes.json();
    if (debugInfo) result._debug = debugInfo;
    return res.status(200).json(result);

  } catch (err) {
    console.error("[brief]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
