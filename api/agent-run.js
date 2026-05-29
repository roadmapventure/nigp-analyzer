// api/agent-run.js
// Shared agent pipeline service — v4.2.0
//
// Exports:
//   assembleContext(agent_id, tenant_id, queryText, taskDescription, options)
//     → { systemPrompt, executionPlan, debugInfo }
//
//   callClaude(systemPrompt, messages, options)
//     → Claude API response (with web_search tool available)
//
// Used by: api/brief.js (analysis agents) and api/web-memory.js (Brent fetch agent)
// Pure functions — no req/res, no Express/Vercel handler.

export const config = { maxDuration: 60, runtime: "nodejs" };

const HAIKU_MODEL  = "claude-haiku-4-5-20251001";
const SONNET_MODEL = "claude-sonnet-4-5";

// ── FALLBACK CONFIGS ──────────────────────────────────────────────────────────

const FALLBACK_ROLE = {
  chloe:   "You are Chloe Okafor, a junior government procurement analyst. Identify obvious spend patterns and flag clear anomalies. Keep analysis concise and direct.",
  mike:    "You are Mike Alvarez, a senior government procurement analyst with expertise in industry best practices. Provide detailed analysis grounded in procurement standards.",
  bob:     "You are Bob Whitfield, a professional government procurement analyst specializing in legal and compliance audits. Cite relevant statutes and standards. Write for Chief Procurement Officers.",
  robyn:   "You are Robyn Castellanos, an expert NIGP consultant and procurement strategist. Provide strategic, forward-looking analysis grounded in NIGP best practices.",
  christy: "You are Christy Park, a marketing designer. Format the provided analysis as a polished executive presentation with clear visual hierarchy.",
};

const FALLBACK_FORMAT = `Return a structured executive briefing with the following sections:\n1. Executive Summary (3-4 sentences, board-ready tone)\n2. Top Risk Findings (specific dollar amounts, vendor names where relevant)\n3. Compliance Flags (cite statute or standard where known)\n4. Recommended Actions (numbered, assign ownership)\n\nUse formal government procurement language. Write in flowing paragraphs, not bullet points. Format as clean HTML using only: <h2>, <h3>, <p>, <strong>. Do not add layout or page-level styles.`;

const FALLBACK_GUARDRAIL = `NEVER:\n- Name a vendor as fraudulent or non-compliant without documented evidence\n- Provide legal conclusions — flag concerns and recommend legal review\n- Extrapolate beyond the data provided\n- Reference thresholds from jurisdictions other than the one configured\n\nALWAYS:\n- Cite the specific NIGP class when referencing commodity risk\n- Attribute dollar amounts to specific vendors or categories where the data supports it`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

function getSupabaseHeaders(supabaseKey) {
  return {
    "Content-Type": "application/json",
    "apikey": supabaseKey || "",
    "Authorization": `Bearer ${supabaseKey || ""}`,
  };
}

async function fetchConfig(agent_id, type, overrideId, tenant_id) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const url = overrideId
      ? `${supabaseUrl}/rest/v1/agent_configs?id=eq.${overrideId}&tenant_id=eq.${encodeURIComponent(tenant_id)}&select=text,name&limit=1`
      : `${supabaseUrl}/rest/v1/agent_configs?tenant_id=eq.${encodeURIComponent(tenant_id)}&agent_id=eq.${encodeURIComponent(agent_id)}&type=eq.${encodeURIComponent(type)}&is_default=eq.true&select=text,name&limit=1`;
    const r = await fetch(url, { method: "GET", headers: getSupabaseHeaders(supabaseKey) });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0] || null;
  } catch { return null; }
}

async function callRagQuery(queryText, agent_id, tenant_id, matchCount) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl || !queryText) return "";
  try {
    const host = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const ragRes = await fetch(`${host}/api/rag-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queryText,
        jurisdiction: "All",
        matchCount: matchCount || 5,
        tenant_id: tenant_id || "global",
        agent_id,
        triggers: [],
      }),
    });
    if (!ragRes.ok) return "";
    const ragJson = await ragRes.json();
    return ragJson.context || "";
  } catch (e) {
    console.warn("[agent-run] RAG query failed:", e.message);
    return "";
  }
}

async function callReflect(role, ragContext, taskDescription, agentLabel) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return "";
  try {
    const prompt = `You are ${agentLabel}. Review your identity, your background knowledge, and the specific task below. Write a concise execution plan.

## YOUR ROLE & IDENTITY
${role}

${ragContext ? `## YOUR BACKGROUND KNOWLEDGE\n${ragContext}\n` : ""}

## SPECIFIC TASK
${taskDescription}

Write a numbered execution plan that reflects your role, incorporates relevant knowledge above, and addresses this specific task. Be concrete — reference specific knowledge entries, selectors, or standards where they apply. This plan will guide your next action.`;

    const reflectRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!reflectRes.ok) return "";
    const reflectData = await reflectRes.json();
    return reflectData.content?.[0]?.text || "";
  } catch (e) {
    console.warn("[agent-run] REFLECT failed:", e.message);
    return "";
  }
}

// ── PUBLIC API ────────────────────────────────────────────────────────────────

/**
 * assembleContext — Step 1-3 of the shared agent pipeline:
 *   fetch configs → RAG retrieval → REFLECT
 *
 * @param {string} agent_id        - 'bob', 'robyn', 'brent', etc.
 * @param {string} tenant_id       - tenant scope (default: 'global')
 * @param {string} queryText       - text for RAG vector search
 * @param {string} taskDescription - description of what the agent is about to do
 * @param {object} options
 *   @param {string}  options.role_prompt_id   - override ID for role config
 *   @param {string}  options.output_format_id - override ID for format config
 *   @param {number}  options.matchCount       - RAG results count (default 5; Brent uses 10)
 *   @param {boolean} options.isFetchAgent     - true for Brent (skips output_format layer)
 *
 * @returns {{ systemPrompt: string, executionPlan: string, debugInfo: object }}
 */
export async function assembleContext(agent_id, tenant_id = "global", queryText, taskDescription, options = {}) {
  const {
    role_prompt_id,
    output_format_id,
    matchCount = 5,
    isFetchAgent = false,
  } = options;

  // Step 1: Fetch configs
  const [roleConfig, formatConfig, guardrailConfig] = await Promise.all([
    fetchConfig(agent_id, "role_prompt",  role_prompt_id,   tenant_id),
    isFetchAgent ? Promise.resolve(null) : fetchConfig(agent_id, "output_format", output_format_id, tenant_id),
    fetchConfig(agent_id, "guardrail",    null,             tenant_id),
  ]);

  const layer01 = roleConfig?.text      || FALLBACK_ROLE[agent_id] || FALLBACK_ROLE.mike;
  const layer04 = isFetchAgent ? null   : (formatConfig?.text || FALLBACK_FORMAT);
  const layer05 = guardrailConfig?.text || (isFetchAgent ? "" : FALLBACK_GUARDRAIL);

  // Step 2: RAG retrieval — vector search, agent-scoped
  const layer02 = await callRagQuery(queryText, agent_id, tenant_id, matchCount);

  // Step 3: REFLECT — Haiku synthesizes before acting
  const agentLabel = roleConfig?.name || agent_id;
  const executionPlan = await callReflect(layer01, layer02, taskDescription, agentLabel);

  // Assemble system prompt layers
  const parts = [`=== ROLE & IDENTITY ===\n${layer01}`];
  if (layer02) parts.push(`=== BACKGROUND KNOWLEDGE ===\n${layer02}`);
  if (executionPlan) parts.push(`=== EXECUTION PLAN ===\n${executionPlan}`);
  if (layer04) parts.push(`=== OUTPUT FORMAT ===\n${layer04}`);
  if (layer05) parts.push(`=== CONSTRAINTS & GUARDRAILS ===\n${layer05}`);

  const systemPrompt = parts.join("\n\n---\n\n");

  const debugInfo = {
    agent_id,
    role_name:       roleConfig?.name      || "fallback",
    format_name:     formatConfig?.name    || (isFetchAgent ? "n/a" : "fallback"),
    guardrail_name:  guardrailConfig?.name || "fallback",
    rag_retrieved:   !!layer02,
    reflect_built:   !!executionPlan,
    layers_assembled: [layer01, layer02, executionPlan, layer04, layer05].filter(Boolean).length,
    layers: {
      role:          layer01,
      rag:           layer02 || null,
      execution_plan: executionPlan || null,
      format:        layer04 || null,
      guardrail:     layer05 || null,
    },
    token_estimates: {
      role:          Math.round(layer01.length / 4),
      rag:           Math.round((layer02 || "").length / 4),
      execution_plan: Math.round((executionPlan || "").length / 4),
      format:        Math.round((layer04 || "").length / 4),
      guardrail:     Math.round((layer05 || "").length / 4),
      total:         Math.round(systemPrompt.length / 4),
    },
  };

  return { systemPrompt, executionPlan, debugInfo };
}

/**
 * callClaude — Step 4 of the shared agent pipeline (ACT).
 * Uses claude-sonnet-4-5 with web_search tool available to all agents.
 *
 * @param {string} systemPrompt  - fully assembled system prompt from assembleContext
 * @param {Array}  messages      - messages array for the conversation
 * @param {object} options
 *   @param {number} options.max_tokens  - default 6000
 *   @param {string} options.model       - default claude-sonnet-4-5
 *
 * @returns {object} raw Anthropic API response
 */
export async function callClaude(systemPrompt, messages, options = {}) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const {
    max_tokens = 6000,
    model = SONNET_MODEL,
  } = options;

  const body = {
    model,
    max_tokens,
    system: systemPrompt,
    messages,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  };

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!anthropicRes.ok) {
    const errText = await anthropicRes.text();
    throw new Error("Anthropic API error: " + errText.slice(0, 300));
  }

  return anthropicRes.json();
}
