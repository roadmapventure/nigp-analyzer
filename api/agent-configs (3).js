export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  const headers = {
    "Content-Type": "application/json",
    "apikey": supabaseKey,
    "Authorization": `Bearer ${supabaseKey}`,
  };

  try {

    // ── GET ──────────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { tenant_id = "global", agent_id, type } = req.query;
      if (!agent_id) return res.status(400).json({ error: "agent_id required" });

      let url = `${supabaseUrl}/rest/v1/agent_configs?tenant_id=eq.${encodeURIComponent(tenant_id)}&agent_id=eq.${encodeURIComponent(agent_id)}&order=created_at.asc`;
      if (type) url += `&type=eq.${encodeURIComponent(type)}`;

      const r = await fetch(url, { method: "GET", headers });
      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: "Supabase fetch failed: " + err.slice(0, 200) });
      }
      const configs = await r.json();
      return res.status(200).json({ configs: configs || [] });
    }

    // ── POST ─────────────────────────────────────────────────────────────────
    if (req.method === "POST") {
      const {
        agent_id,
        tenant_id = "global",
        type,
        name,
        text,
        is_default = false,
        is_user_selectable = false,
      } = req.body;

      if (!agent_id || !type || !name || !text) {
        return res.status(400).json({ error: "agent_id, type, name, text required" });
      }
      const validTypes = ["role_prompt", "output_format", "guardrail"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `type must be one of: ${validTypes.join(", ")}` });
      }

      // Clear existing defaults for this agent+type if this row is being set as default
      if (is_default) {
        await fetch(
          `${supabaseUrl}/rest/v1/agent_configs?tenant_id=eq.${encodeURIComponent(tenant_id)}&agent_id=eq.${encodeURIComponent(agent_id)}&type=eq.${encodeURIComponent(type)}`,
          { method: "PATCH", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify({ is_default: false }) }
        );
      }

      const insertRes = await fetch(
        `${supabaseUrl}/rest/v1/agent_configs`,
        {
          method: "POST",
          headers: { ...headers, "Prefer": "return=representation" },
          body: JSON.stringify({ agent_id, tenant_id, type, name, text, is_default, is_user_selectable, updated_at: new Date().toISOString() }),
        }
      );
      if (!insertRes.ok) {
        const err = await insertRes.text();
        return res.status(500).json({ error: "Supabase insert failed: " + err.slice(0, 200) });
      }
      const saved = await insertRes.json();
      return res.status(201).json({ config: Array.isArray(saved) ? saved[0] : saved });
    }

    // ── PATCH ────────────────────────────────────────────────────────────────
    if (req.method === "PATCH") {
      const { id, tenant_id = "global", ...fields } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });

      // If setting as default, first fetch the row to get agent_id + type, then clear others
      if (fields.is_default === true) {
        const lookupRes = await fetch(
          `${supabaseUrl}/rest/v1/agent_configs?id=eq.${id}&select=agent_id,type`,
          { method: "GET", headers }
        );
        if (lookupRes.ok) {
          const rows = await lookupRes.json();
          const existing = rows?.[0];
          if (existing) {
            await fetch(
              `${supabaseUrl}/rest/v1/agent_configs?tenant_id=eq.${encodeURIComponent(tenant_id)}&agent_id=eq.${encodeURIComponent(existing.agent_id)}&type=eq.${encodeURIComponent(existing.type)}&id=neq.${id}`,
              { method: "PATCH", headers: { ...headers, "Prefer": "return=minimal" }, body: JSON.stringify({ is_default: false }) }
            );
          }
        }
      }

      // Strip server-only fields from the update payload
      const updatePayload = { ...fields, updated_at: new Date().toISOString() };
      delete updatePayload.id;
      delete updatePayload.agent_id;
      delete updatePayload.tenant_id;
      delete updatePayload.created_at;

      const patchRes = await fetch(
        `${supabaseUrl}/rest/v1/agent_configs?id=eq.${id}&tenant_id=eq.${encodeURIComponent(tenant_id)}`,
        {
          method: "PATCH",
          headers: { ...headers, "Prefer": "return=representation" },
          body: JSON.stringify(updatePayload),
        }
      );
      if (!patchRes.ok) {
        const err = await patchRes.text();
        return res.status(500).json({ error: "Supabase patch failed: " + err.slice(0, 200) });
      }
      const updated = await patchRes.json();
      return res.status(200).json({ config: Array.isArray(updated) ? updated[0] : updated });
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id, tenant_id = "global" } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });

      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/agent_configs?id=eq.${id}&tenant_id=eq.${encodeURIComponent(tenant_id)}`,
        { method: "DELETE", headers: { ...headers, "Prefer": "return=minimal" } }
      );
      if (!deleteRes.ok) {
        const err = await deleteRes.text();
        return res.status(500).json({ error: "Supabase delete failed: " + err.slice(0, 200) });
      }
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("[agent-configs]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
