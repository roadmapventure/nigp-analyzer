// api/web-memory.js
// v4.2.0: GET endpoint refactored to use rag-query.js (vector search) + agent-run (REFLECT)
//         Drops all custom string filter code and manual Supabase queries for entries.
//         POST endpoint (save learnings) kept intact — same pattern as ingest.js.
//
//   GET  ?url=<encoded_url>&goal=<encoded_goal>  — retrieve memory + execution plan before a run
//   POST                                          — save what the agent learned after a run

import { assembleContext } from "./agent-run.js";

export const config = { maxDuration: 60, runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const openaiKey   = process.env.OPENAI_API_KEY;

  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  // ── GET: retrieve memory + execution plan before a Brent fetch run ─────────
  if (req.method === "GET") {
    const { url, dateFrom, dateTo, goal } = req.query;
    if (!url) return res.status(400).json({ error: "url is required" });

    try {
      // queryText for RAG — semantically rich so vector search finds relevant portal history
      const queryText = `${url} government spending data download ${dateFrom || ""} ${dateTo || ""} ${goal || ""}`.trim();

      // taskDescription for REFLECT — what Brent is about to do
      const taskDescription = [
        `You are about to download government spending data from this portal: ${url}`,
        dateFrom && dateTo ? `Target date range: ${dateFrom} to ${dateTo}` : null,
        goal ? `Specific goal: ${goal}` : null,
        "Review your knowledge and write a step-by-step execution plan for this run.",
      ].filter(Boolean).join("\n");

      // Full pipeline: configs + RAG (matchCount=10 for Brent — needs more portal history) + REFLECT
      const { systemPrompt, executionPlan, debugInfo } = await assembleContext(
        "brent",
        "global",
        queryText,
        taskDescription,
        {
          matchCount: 10,
          isFetchAgent: true,
        }
      );

      return res.status(200).json({
        memoryContext: systemPrompt,
        executionPlan,
        hasResume:    debugInfo.layers.role  ? true  : false,
        hasPlaybook:  debugInfo.layers.guardrail ? true : false,
        ragMatchCount: debugInfo.layers.rag ? debugInfo.token_estimates.rag : 0,
        _debug: debugInfo,
      });

    } catch (err) {
      console.error("[web-memory GET]", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: save what the agent learned after a run ─────────────────────────
  // Identical pattern to ingest.js — embed + upsert to knowledge_entries
  if (req.method === "POST") {
    if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

    try {
      const {
        url,
        success,
        steps_taken,
        total_time_seconds,
        total_parse_retries,
        searches_used,
        action_history,   // full array of {action, target, value, failed, error}
        final_screenshot, // base64 — not stored, just used for Claude's analysis
      } = req.body;

      if (!url || !action_history) {
        return res.status(400).json({ error: "url and action_history are required" });
      }

      const anthropicKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

      const historyText = action_history.map((h, i) => {
        const result = h.failed ? `FAILED (${h.error || "unknown"})` : "succeeded";
        const val = h.value ? ` with value "${h.value}"` : "";
        return `Step ${i + 1}: ${h.action} on "${h.target}"${val} → ${result}`;
      }).join("\n");

      const timeStr = total_time_seconds
        ? ` (${total_time_seconds < 60 ? total_time_seconds.toFixed(1)+"s" : Math.floor(total_time_seconds/60)+"m "+Math.round(total_time_seconds%60)+"s"})`
        : "";
      const retryNote = total_parse_retries > 0
        ? ` (${total_parse_retries} screenshot/parse retries — portal may load slowly)`
        : "";
      const outcome = success
        ? `SUCCESS in ${steps_taken} steps${timeStr}${retryNote}`
        : `FAILED after ${steps_taken} steps${timeStr}${retryNote}`;
      const outcomeTag = success ? "✓ Success" : "✗ Failed";

      const learningPrompt = `You are Brent Matthews, a Data Research Specialist AI agent. You just attempted to download government spending data from this portal: ${url}

Outcome: ${outcome}

Here is the complete action history:
${historyText}

Write a concise field note that will help you avoid mistakes on future runs. ${!success ? "Focus especially on what went wrong and what to try differently next time." : "Focus on what worked so it can be repeated reliably."} ${total_parse_retries > 0 ? `There were ${total_parse_retries} screenshot/parse retries — note which steps were slow and whether adding a longer wait before taking screenshots would help.` : ""}

Structure your response as valid JSON only:
{
  "title": "Short descriptive title including outcome (e.g., 'Maryland MD-VIEW · ${outcomeTag} · ${new Date().toLocaleDateString()}')",
  "portal_notes": "2-4 sentences: what worked, what failed, what to do differently next time",
  "worked_selectors": [{"action": "DOWNLOAD", "selector": "button:has-text('Save CSV File')", "context": "appears below results table after search"}],
  "failed_selectors": [{"selector": "...", "why": "..."}],
  "cross_site_pattern": "Optional: any general pattern observed that applies across government portals (or null)",
  "recommendation": "The single most important thing to know for next time"
}`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{ role: "user", content: learningPrompt }],
        }),
      });

      if (!claudeRes.ok) {
        const err = await claudeRes.text();
        return res.status(500).json({ error: "Claude learning call failed: " + err.slice(0, 200) });
      }

      const claudeData = await claudeRes.json();
      const rawLearning = claudeData.content?.[0]?.text || "";

      let learning;
      try {
        const cleaned = rawLearning.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        learning = JSON.parse(cleaned);
      } catch {
        learning = {
          title: `${new URL(url).hostname} · ${success ? "Success" : "Failed"} · ${new Date().toLocaleDateString()}`,
          portal_notes: rawLearning.slice(0, 500),
          worked_selectors: [],
          failed_selectors: [],
          cross_site_pattern: null,
          recommendation: "",
        };
      }

      // Build content string for storage + embedding
      const content = [
        `Portal: ${url}`,
        `Outcome: ${outcome}`,
        total_time_seconds ? `Time: ${total_time_seconds < 60 ? total_time_seconds.toFixed(1)+"s" : Math.floor(total_time_seconds/60)+"m "+Math.round(total_time_seconds%60)+"s"}` : null,
        total_parse_retries > 0 ? `Parse retries: ${total_parse_retries} (screenshot timeouts or slow portal loads)` : null,
        searches_used > 0 ? `Web searches used: ${searches_used} — key findings are in the action history above` : null,
        ``,
        `Notes: ${learning.portal_notes}`,
        ``,
        learning.worked_selectors?.length > 0
          ? `Worked: ${learning.worked_selectors.map(s => `${s.action} on "${s.selector}" — ${s.context}`).join("; ")}`
          : null,
        learning.failed_selectors?.length > 0
          ? `Failed: ${learning.failed_selectors.map(s => `"${s.selector}" — ${s.why}`).join("; ")}`
          : null,
        learning.recommendation
          ? `Key insight: ${learning.recommendation}`
          : null,
        learning.cross_site_pattern
          ? `General pattern: ${learning.cross_site_pattern}`
          : null,
      ].filter(Boolean).join("\n");

      // Generate embedding (same pattern as ingest.js)
      const embedRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: `${learning.title}\n\n${content}`,
        }),
      });

      if (!embedRes.ok) {
        return res.status(500).json({ error: "Embedding failed" });
      }

      const embedData = await embedRes.json();
      const embedding = embedData.data?.[0]?.embedding;

      // Save to knowledge_entries — same structure as ingest.js
      const payload = {
        title:         learning.title,
        category:      "Portal Navigation",
        jurisdiction:  "All",
        priority:      success ? 75 : 55,
        triggers:      [],
        content,
        embedding,
        status:        "active",
        tenant_id:     "global",
        agent_id:      "brent",
        source:        "agent",
        steps_taken:   steps_taken || null,
        teaching_note: `${url}|${success ? "success" : "failed"}`,
      };

      const upsertRes = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_entries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=representation",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!upsertRes.ok) {
        const err = await upsertRes.text();
        return res.status(500).json({ error: "Supabase save failed: " + err.slice(0, 200) });
      }

      const saved = await upsertRes.json();

      return res.status(200).json({
        success: true,
        entry: saved?.[0],
        learning,
      });

    } catch (err) {
      console.error("[web-memory POST]", err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
