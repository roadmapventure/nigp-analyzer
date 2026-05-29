// api/brief.js
// Generates AI briefing with full 5-layer prompt assembly.
// v4.2.0: thin wrapper — delegates context assembly and Claude call to agent-run.js
// Uses raw fetch only — no @anthropic-ai/sdk, no @supabase/supabase-js

import { assembleContext, callClaude } from "./agent-run.js";

export const config = { maxDuration: 60, runtime: "nodejs" };

export default async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

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

    // ── LEGACY PATH — direct system prompt (AI Briefing tab, no agent_id) ────
    if (!agent_id || system) {
      const assembledSystem = system || "You are a senior government procurement analyst writing an executive briefing for a Chief Procurement Officer (CPO). Write in a direct, authoritative tone. Use precise numbers from the data. Structure your response in clean HTML using only: <h2>, <h3>, <p>, <strong>, <span style=\"...\">, <div style=\"...\">. Use colors: accent #b6873a, risk #a83319, warning #b8721a, text #28221a. Do not use bullet points. Write in flowing paragraphs like a McKinsey memo. IMPORTANT: Do not add any margin, padding, max-width, or width styles to any element. Do not wrap content in a body or html tag. Do not add page-level layout styles.";

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
        console.error("[brief] Anthropic error (legacy):", errText);
        return res.status(anthropicRes.status).json({ error: "Anthropic API error: " + errText.slice(0, 300) });
      }

      const result = await anthropicRes.json();
      return res.status(200).json(result);
    }

    // ── AGENT PATH — full pipeline via agent-run ──────────────────────────────

    // Build queryText and taskDescription for RAG and REFLECT
    // ragContext.queryText is pre-assembled by the frontend from spend data characteristics
    const queryText = ragContext?.queryText || `procurement analysis for ${agent_id}`;
    const taskDescription = ragContext?.queryText
      ? `Analyze this government procurement dataset: ${ragContext.queryText}`
      : "Analyze the provided government procurement data and generate an executive briefing.";

    // Pat (noMemory=true) bypasses agent-run entirely — she's the control case
    // Pat is identified by agent_id 'pat' — cold every time, no configs, no RAG, no reflect
    if (agent_id === "pat") {
      const patSystem = "You are Pat, a junior procurement intern. Analyze the data as provided with no specialized training.";
      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens, system: patSystem, messages }),
      });
      if (!anthropicRes.ok) {
        const errText = await anthropicRes.text();
        return res.status(anthropicRes.status).json({ error: "Anthropic API error: " + errText.slice(0, 300) });
      }
      const result = await anthropicRes.json();
      result._debug = { agent_id: "pat", note: "noMemory=true — bypassed agent-run entirely" };
      return res.status(200).json(result);
    }

    // Assemble context via shared pipeline (configs + RAG + REFLECT)
    const { systemPrompt, executionPlan, debugInfo } = await assembleContext(
      agent_id,
      tenant_id,
      queryText,
      taskDescription,
      {
        role_prompt_id,
        output_format_id,
        matchCount: 5,
        isFetchAgent: false,
      }
    );

    // ACT — Claude Sonnet with web_search available
    let result;
    try {
      result = await callClaude(systemPrompt, messages, { max_tokens, model: "claude-sonnet-4-5" });
    } catch (err) {
      console.error("[brief] callClaude error:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // Attach debug info and full assembled prompt for test console
    result._debug = debugInfo;
    result._system = systemPrompt;

    return res.status(200).json(result);

  } catch (err) {
    console.error("[brief]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
