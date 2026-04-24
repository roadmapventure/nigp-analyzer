// api/agent-configs.js
// Handles CRUD for agent_configs table: role_prompt, output_format, guardrail
// GET    ?tenant_id=&agent_id=&type=
// POST   { agent_id, tenant_id, type, name, text, is_default, is_user_selectable }
// PATCH  { id, tenant_id, ...fields }
// DELETE { id, tenant_id }

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // ── GET ────────────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { tenant_id = "global", agent_id, type } = req.query;
      if (!agent_id) return res.status(400).json({ error: "agent_id required" });

      let query = supabase
        .from("agent_configs")
        .select("*")
        .eq("tenant_id", tenant_id)
        .eq("agent_id", agent_id)
        .order("created_at", { ascending: true });

      if (type) query = query.eq("type", type);

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json({ configs: data || [] });
    }

    // ── POST ───────────────────────────────────────────────────────────────────
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

      // If this is being set as default, clear existing defaults first
      if (is_default) {
        await supabase
          .from("agent_configs")
          .update({ is_default: false })
          .eq("tenant_id", tenant_id)
          .eq("agent_id", agent_id)
          .eq("type", type);
      }

      const { data, error } = await supabase
        .from("agent_configs")
        .insert({
          agent_id,
          tenant_id,
          type,
          name,
          text,
          is_default,
          is_user_selectable,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ config: data });
    }

    // ── PATCH ──────────────────────────────────────────────────────────────────
    if (req.method === "PATCH") {
      const { id, tenant_id = "global", ...fields } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });

      // If setting as default, atomically clear others of same type+agent first
      if (fields.is_default === true) {
        // Fetch this row to get agent_id and type
        const { data: existing } = await supabase
          .from("agent_configs")
          .select("agent_id, type")
          .eq("id", id)
          .single();

        if (existing) {
          await supabase
            .from("agent_configs")
            .update({ is_default: false })
            .eq("tenant_id", tenant_id)
            .eq("agent_id", existing.agent_id)
            .eq("type", existing.type)
            .neq("id", id);
        }
      }

      const updatePayload = { ...fields, updated_at: new Date().toISOString() };
      // Strip fields that shouldn't be client-updated
      delete updatePayload.id;
      delete updatePayload.agent_id;
      delete updatePayload.tenant_id;
      delete updatePayload.created_at;

      const { data, error } = await supabase
        .from("agent_configs")
        .update(updatePayload)
        .eq("id", id)
        .eq("tenant_id", tenant_id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ config: data });
    }

    // ── DELETE ─────────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id, tenant_id = "global" } = req.body;
      if (!id) return res.status(400).json({ error: "id required" });

      const { error } = await supabase
        .from("agent_configs")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenant_id);

      if (error) throw error;
      return res.status(200).json({ deleted: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[agent-configs]", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
