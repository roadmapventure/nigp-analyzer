// api/load-entries.js
// v4.2.19 — pass created_at as raw field for Run ID in training card

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  try {
    const tenant_id = req.query.tenant_id || "global";
    const agent_id  = req.query.agent_id  || null;

    // Build agent filter — if agent_id provided, fetch that agent's entries + legacy entries
    const agentFilter = agent_id
      ? `&or=(agent_id.eq.${encodeURIComponent(agent_id)},agent_id.eq.legacy)`
      : "";

    const fetchRes = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_entries?tenant_id=eq.${encodeURIComponent(tenant_id)}${agentFilter}&select=id,title,category,jurisdiction,priority,triggers,content,status,tenant_id,agent_id,teaching_note,source,steps_taken,created_at&order=created_at.desc`,
      {
        method: "GET",
        headers: {
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!fetchRes.ok) {
      const err = await fetchRes.text();
      return res.status(500).json({ error: "Supabase fetch failed: " + err.slice(0, 200) });
    }

    const entries = await fetchRes.json();

    const formatted = (entries || []).map(e => ({
      id:            e.id,
      title:         e.title,
      category:      e.category,
      jurisdiction:  e.jurisdiction,
      priority:      e.priority,
      triggers:      e.triggers || [],
      status:        e.status,
      tenant_id:     e.tenant_id,
      agent_id:      e.agent_id || "legacy",
      teaching_note: e.teaching_note || "",
      source_type:   e.source || "user",
      steps_taken:   e.steps_taken || null,
      created_at:    e.created_at || null,
      content:       e.content || "",
      isDemo:        false,
      source:        e.created_at
        ? `Added ${new Date(e.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}`
        : "Knowledge base",
    }));

    return res.status(200).json({ entries: formatted, count: formatted.length });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
