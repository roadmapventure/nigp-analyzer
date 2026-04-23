export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  const openaiKey   = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      const { id, tenant_id } = req.body;
      if (!id) return res.status(400).json({ error: "id is required" });

      const deleteRes = await fetch(
        `${supabaseUrl}/rest/v1/knowledge_entries?id=eq.${id}&tenant_id=eq.${tenant_id || "global"}`,
        {
          method: "DELETE",
          headers: {
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
            "Prefer": "return=minimal",
          },
        }
      );

      if (!deleteRes.ok) {
        const err = await deleteRes.text();
        return res.status(500).json({ error: "Supabase delete failed: " + err.slice(0, 200) });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // ── POST ────────────────────────────────────────────────────────────────────
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY not configured" });

  try {
    const {
      id, title, category, jurisdiction, priority,
      triggers, content, status, tenant_id,
      agent_id,       // v3: which agent this document belongs to
      teaching_note,  // v3: admin instruction to agent on how to use this doc
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    const MAX_EMBED_CHARS = 12000;
    const truncatedContent = content.length > MAX_EMBED_CHARS
      ? content.slice(0, MAX_EMBED_CHARS) + " [truncated for embedding]"
      : content;

    const cleanedContent = truncatedContent
      .replace(/[^\x20-\x7E\n\r]/g, " ")
      .replace(/\s{3,}/g, "  ")
      .trim();

    const textToEmbed = `${title}\n\n${cleanedContent}`;

    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: textToEmbed }),
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      return res.status(500).json({ error: "OpenAI embedding failed: " + err.slice(0, 200) });
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data?.[0]?.embedding;
    if (!embedding) return res.status(500).json({ error: "No embedding returned from OpenAI" });

    const payload = {
      title,
      category:      category      || "Compliance",
      jurisdiction:  jurisdiction  || "All",
      priority:      priority      || 50,
      triggers:      triggers      || [],
      content,
      embedding,
      status:        status        || "active",
      tenant_id:     tenant_id     || "global",
      agent_id:      agent_id      || "legacy",   // "legacy" = v1/v2 entries
      teaching_note: teaching_note || null,
    };

    if (id) payload.id = id;

    const upsertRes = await fetch(
      `${supabaseUrl}/rest/v1/knowledge_entries?on_conflict=id`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!upsertRes.ok) {
      const err = await upsertRes.text();
      return res.status(500).json({ error: "Supabase upsert failed: " + err.slice(0, 200) });
    }

    const saved = await upsertRes.json();
    return res.status(200).json({ success: true, entry: saved?.[0] || payload });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
