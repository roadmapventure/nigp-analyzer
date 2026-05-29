// api/web-memory.js
// Two endpoints:
export const config = { maxDuration: 60, runtime: "nodejs" };

//   GET  ?url=<encoded_url>  — retrieve memory for a portal URL before a run
//   POST                     — save what the agent learned after a run

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

  // ── GET: retrieve memory for a URL ──────────────────────────────────────────
  if (req.method === "GET") {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: "url is required" });

    try {
      // Extract domain for cross-site pattern retrieval
      let domain = "";
      try { domain = new URL(url).hostname; } catch {}

      // 1. Fetch portal-specific entries for this exact URL
      const portalRes = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_entries?agent_id=eq.brent&tenant_id=eq.global&source=eq.agent&select=id,title,content,teaching_note,steps_taken,created_at&order=created_at.asc`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const allEntries = portalRes.ok ? await portalRes.json() : [];

      // Filter: entries matching this URL, plus general cross-site patterns
      // teaching_note format: "url|success" or "url|failed"
      const urlEntries = allEntries.filter(e =>
        e.teaching_note?.startsWith(url) || e.teaching_note?.includes(domain)
      );
      const generalEntries = allEntries.filter(e =>
        !e.teaching_note?.includes(url) && !e.teaching_note?.includes(domain)
      ).slice(0, 5);

      // 2. Also fetch user-uploaded Brent training (non-agent entries)
      const userRes = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_entries?agent_id=eq.brent&tenant_id=eq.global&source=eq.user&select=id,title,content,teaching_note&order=priority.desc&limit=5`,
        {
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const userEntries = userRes.ok ? await userRes.json() : [];

      // 4. Fetch Brent's playbook (guardrail) from agent_configs
      let playbookText = "";
      try {
        const pbRes = await fetch(
          `${supabaseUrl}/rest/v1/agent_configs?agent_id=eq.brent&tenant_id=eq.global&type=eq.guardrail&is_default=eq.true&select=text&limit=1`,
          {
            headers: {
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (pbRes.ok) {
          const pbData = await pbRes.json();
          playbookText = pbData?.[0]?.text || "";
        }
      } catch (e) {
        console.warn("Playbook fetch failed:", e.message);
      }

      // Build the memory context string injected into agent system prompt
      const sections = [];
      
      // Playbook goes first — it governs all behavior
      if (playbookText) {
        sections.push(`## BRENT'S OPERATIONAL PLAYBOOK — FOLLOW THESE RULES FIRST:\n${playbookText}`);
      }

      if (urlEntries.length > 0) {
        // Split into successes and failures — successes dominate the prompt
        const successes = urlEntries
          .filter(e => e.teaching_note?.includes("|success"))
          .sort((a,b) => (a.steps_taken||99) - (b.steps_taken||99)); // fastest first
        const failures = urlEntries
          .filter(e => !e.teaching_note?.includes("|success"));

        // Best success = the one with fewest steps
        const best = successes[0];
        const recentSuccess = successes.find(e => e !== best); // second best for confirmation

        let memParts = [];

        if (best) {
          const bestSteps = best.steps_taken ? ` in ${best.steps_taken} steps` : "";
          const bestTime = (() => {
            const m = (best.content||"").match(/Time: ([\d.]+[ms]+(?:\s*\d+s)?)/);
            return m ? ` / ${m[1]}` : "";
          })();
          memParts.push(
            `## ✅ BEST METHOD — REPLICATE THIS EXACTLY (${bestSteps}${bestTime}):\n` +
            `DO NOT EXPLORE. DO NOT TRY OTHER APPROACHES. Execute this proven method:\n\n` +
            best.content
          );
        }

        if (recentSuccess) {
          memParts.push(
            `## ✅ CONFIRMED AGAIN in a later visit${recentSuccess.steps_taken ? ` (${recentSuccess.steps_taken} steps)` : ""}:\n` +
            recentSuccess.content
          );
        }

        if (failures.length > 0) {
          // Only include the most informative failure (most steps = most info)
          const worstFail = failures.sort((a,b) => (b.steps_taken||0) - (a.steps_taken||0))[0];
          memParts.push(
            `## ❌ FAILED APPROACH — DO NOT REPEAT (${failures.length} failed run${failures.length>1?"s":""} total):\n` +
            `These selectors and approaches did NOT work — skip them entirely:\n\n` +
            worstFail.content
          );
        }

        sections.push(
          `## PORTAL MEMORY: ${url} (${urlEntries.length} total visits, ${successes.length} successful)\n` +
          memParts.join("\n\n---\n\n")
        );
      }

      if (generalEntries.length > 0) {
        sections.push(
          `## CROSS-SITE PATTERNS FROM OTHER GOVERNMENT PORTALS\n` +
          `These patterns were observed across multiple government portals and likely apply here:\n\n` +
          generalEntries.map(e => `**${e.title}:**\n${e.content}`).join("\n\n")
        );
      }

      if (userEntries.length > 0) {
        sections.push(
          `## RESEARCH KNOWLEDGE (user-provided):\n` +
          userEntries.map(e => {
            const note = e.teaching_note ? `\n[Note: ${e.teaching_note}]` : "";
            return `**${e.title}:**${note}\n${e.content}`;
          }).join("\n\n")
        );
      }

      const memoryContext = sections.length > 0
        ? sections.join("\n\n---\n\n")
        : "";

      return res.status(200).json({
        memoryContext,
        portalEntryCount: urlEntries.length,  // all visits to this URL
        generalEntryCount: generalEntries.length,
        userEntryCount: userEntries.length,
      });

    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST: save what the agent learned after a run ────────────────────────────
  if (req.method === "POST") {
    if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

    try {
      const {
        url,
        success,
        steps_taken,
        total_time_seconds,
        action_history,   // full array of {action, target, value, failed, error}
        final_screenshot, // base64 — not stored, just used for Claude's analysis
      } = req.body;

      if (!url || !action_history) {
        return res.status(400).json({ error: "url and action_history are required" });
      }

      // Ask Claude to write the learning entry
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
      const outcome = success
        ? `SUCCESS in ${steps_taken} steps${timeStr}`
        : `FAILED after ${steps_taken} steps${timeStr}`;
      const outcomeTag = success ? "✓ Success" : "✗ Failed";

      const learningPrompt = `You are Brent Matthews, a Data Research Specialist AI agent. You just attempted to download government spending data from this portal: ${url}

Outcome: ${outcome}

Here is the complete action history:
${historyText}

Write a concise field note that will help you avoid mistakes on future runs. ${!success ? "Focus especially on what went wrong and what to try differently next time." : "Focus on what worked so it can be repeated reliably."}

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

      // Generate embedding
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

      // Save to knowledge_entries
      const payload = {
        title:         learning.title,
        category:      "Portal Navigation",
        jurisdiction:  "All",
        priority:      success ? 75 : 55,  // Failed runs still valuable — higher than original 40
        triggers:      [],
        content,
        embedding,
        status:        "active",
        tenant_id:     "global",
        agent_id:      "brent",
        source:        "agent",
        steps_taken:   steps_taken || null,
        teaching_note: `${url}|${success ? "success" : "failed"}`, // url|outcome for retrieval and display
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
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
