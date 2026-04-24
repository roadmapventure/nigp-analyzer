// api/brief.js
// Generates AI briefing with full 5-layer prompt assembly:
//   Layer 01 - Role & Behavior  (agent_configs: role_prompt, is_default or override)
//   Layer 02 - Background (RAG) (fetched via rag-query, passed in ragContext)
//   Layer 03 - Analysis Payload (passed in from client as messages[0].content)
//   Layer 04 - Output Structure (agent_configs: output_format, is_default or override)
//   Layer 05 - Guardrails       (agent_configs: guardrail)

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Fetch a single config row — by override id, or by default flag
async function fetchConfig(agent_id, type, overrideId = null, tenant_id = "global") {
  if (overrideId) {
    const { data } = await supabase
      .from("agent_configs")
      .select("text, name")
      .eq("id", overrideId)
      .eq("tenant_id", tenant_id)
      .single();
    return data;
  }

  const { data } = await supabase
    .from("agent_configs")
    .select("text, name")
    .eq("tenant_id", tenant_id)
    .eq("agent_id", agent_id)
    .eq("type", type)
    .eq("is_default", true)
    .single();

  return data;
}

// Fallback system prompts when no agent_configs row exists
const FALLBACK_ROLE = {
  chloe:  "You are Chloe Okafor, a junior government procurement analyst. Identify obvious spend patterns and flag clear anomalies. Keep analysis concise and direct.",
  mike:   "You are Mike Alvarez, a senior government procurement analyst with expertise in industry best practices. Provide detailed analysis grounded in procurement standards.",
  bob:    "You are Bob Whitfield, a professional government procurement analyst specializing in legal and compliance audits. Cite relevant statutes and standards. Write for Chief Procurement Officers.",
  robyn:  "You are Robyn Castellanos, an expert NIGP consultant and procurement strategist. Provide strategic, forward-looking analysis grounded in NIGP best practices.",
  christy:"You are Christy Park, a marketing designer. Format the provided analysis as a polished executive presentation with clear visual hierarchy.",
};

const FALLBACK_FORMAT = `Return a structured executive briefing with the following sections:
1. Executive Summary (3-4 sentences, board-ready tone)
2. Top Risk Findings (specific dollar amounts, vendor names where relevant)
3. Compliance Flags (cite statute or standard where known)
4. Recommended Actions (numbered, assign ownership)

Use formal government procurement language. Write in flowing paragraphs, not bullet points. Format as clean HTML using only: <h2>, <h3>, <p>, <strong>. Do not add layout or page-level styles.`;

const FALLBACK_GUARDRAIL = `NEVER:
- Name a vendor as fraudulent or non-compliant without documented evidence
- Provide legal conclusions — flag concerns and recommend legal review
- Extrapolate beyond the data provided
- Reference thresholds from jurisdictions other than the one configured
- Recommend sole-source awards without citing a specific statutory exception

ALWAYS:
- Cite the specific NIGP class when referencing commodity risk
- Flag when analysis confidence is low due to data gaps
- Attribute dollar amounts to specific vendors or categories where the data supports it`;

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      messages,
      system,            // legacy direct system override (AI Briefing tab)
      agent_id,
      tenant_id = "global",
      role_prompt_id,    // optional session override from client
      output_format_id,  // optional session override from client
      ragContext,        // { queryText, jurisdiction, triggers } — handled by this endpoint
      max_tokens = 6000,
    } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array required" });
    }

    // ── Legacy path: system prompt passed directly (AI Briefing tab, no agent_id) ──
    if (!agent_id || system) {
      const finalSystem = system || "You are a senior government procurement analyst.";
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens,
        system: finalSystem,
        messages,
      });
      return res.status(200).json(response);
    }

    // ── New path: assemble 5-layer prompt from agent_configs ──────────────────

    // Layer 01 — Role & Behavior
    const roleConfig = await fetchConfig(agent_id, "role_prompt", role_prompt_id, tenant_id);
    const layer01 = roleConfig?.text || FALLBACK_ROLE[agent_id] || FALLBACK_ROLE.mike;

    // Layer 02 — Background (RAG context)
    let layer02 = "";
    if (ragContext?.queryText) {
      try {
        const ragRes = await fetch(`${process.env.VERCEL_URL ? "https://"+process.env.VERCEL_URL : "http://localhost:3000"}/api/rag-query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            queryText: ragContext.queryText,
            jurisdiction: ragContext.jurisdiction || "All",
            matchCount: 5,
            tenant_id,
            agent_id,
            triggers: ragContext.triggers || [],
          }),
        });
        const ragJson = await ragRes.json();
        if (ragJson.context) layer02 = ragJson.context;
      } catch (ragErr) {
        console.warn("[brief] RAG query failed, continuing without context:", ragErr.message);
      }
    }

    // Layer 04 — Output Structure
    const formatConfig = await fetchConfig(agent_id, "output_format", output_format_id, tenant_id);
    const layer04 = formatConfig?.text || FALLBACK_FORMAT;

    // Layer 05 — Guardrails
    const guardrailConfig = await fetchConfig(agent_id, "guardrail", null, tenant_id);
    const layer05 = guardrailConfig?.text || FALLBACK_GUARDRAIL;

    // ── Assemble full system prompt ───────────────────────────────────────────
    const parts = [];

    parts.push(`=== ROLE & IDENTITY ===\n${layer01}`);

    if (layer02) {
      parts.push(`=== BACKGROUND KNOWLEDGE (Retrieved for this analysis) ===\n${layer02}`);
    }

    parts.push(`=== OUTPUT FORMAT ===\n${layer04}`);
    parts.push(`=== CONSTRAINTS & GUARDRAILS ===\n${layer05}`);

    const assembledSystem = parts.join("\n\n---\n\n");

    // ── Call Anthropic ────────────────────────────────────────────────────────
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens,
      system: assembledSystem,
      messages,
    });

    // Include which configs were used (useful for test console display)
    return res.status(200).json({
      ...response,
      _debug: {
        agent_id,
        role_name: roleConfig?.name || "fallback",
        format_name: formatConfig?.name || "fallback",
        guardrail_name: guardrailConfig?.name || "fallback",
        rag_retrieved: !!layer02,
        layers_assembled: layer02 ? 5 : 4,
      },
    });
  } catch (err) {
    console.error("[brief]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
