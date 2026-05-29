// api/web-memory-patch.js
// Called by the browser after a run completes to update the most recent
// Brent training entry with canonical browser-measured steps and time.
// This ensures the training card shows the same numbers as the fetch view.

export const config = { maxDuration: 15, runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Missing Supabase config" });

  try {
    const { steps_taken, total_time_seconds } = req.body;

    // Find the most recently created agent entry for Brent
    const findRes = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_entries?agent_id=eq.brent&source=eq.agent&select=id,content,created_at&order=created_at.desc&limit=1`,
      {
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!findRes.ok) return res.status(500).json({ error: "Could not find entry" });
    const entries = await findRes.json();
    if (!entries?.length) return res.status(404).json({ error: "No entries found" });

    const entry = entries[0];

    // Build time string for content update
    const timeStr = total_time_seconds
      ? total_time_seconds < 60
        ? `${total_time_seconds.toFixed(1)}s`
        : `${Math.floor(total_time_seconds / 60)}m ${Math.round(total_time_seconds % 60)}s`
      : null;

    // Update content to replace any existing Time: line with accurate value
    let updatedContent = entry.content || "";
    if (timeStr) {
      updatedContent = updatedContent.replace(/Time: [\d.]+[ms]+(?:\s*\d+s)?/g, `Time: ${timeStr}`);
      // If no Time line exists, add it after Outcome line
      if (!updatedContent.includes("Time:")) {
        updatedContent = updatedContent.replace(
          /^(Outcome: .+)$/m,
          `$1\nTime: ${timeStr}`
        );
      }
    }

    // PATCH the entry
    const patchRes = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_entries?id=eq.${entry.id}`,
      {
        method: "PATCH",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({
          steps_taken: steps_taken ?? entry.steps_taken,
          content: updatedContent,
        }),
      }
    );

    if (!patchRes.ok) {
      const err = await patchRes.text();
      return res.status(500).json({ error: "Patch failed: " + err.slice(0, 200) });
    }

    return res.status(200).json({ success: true, id: entry.id, steps_taken, timeStr });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
