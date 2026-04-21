export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const openaiKey  = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!openaiKey)   return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
  if (!supabaseUrl) return res.status(500).json({ error: "SUPABASE_URL not configured" });
  if (!supabaseKey) return res.status(500).json({ error: "SUPABASE_SERVICE_KEY not configured" });

  try {
    const { id, title, category, jurisdiction, priority, triggers, content, status } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    // ── Step 1: Generate embedding via OpenAI ──────────────────────────────
    // text-embedding-3-small has an 8,192 token limit (~6,000 words).
    // We truncate to ~5,500 words to stay safely under the limit.
    // The full content is still stored in Supabase — only the embedding
    // input is truncated, not the stored text.
    const MAX_EMBED_CHARS = 12000; // ~3,000 words — safe limit for noisy PDF-extracted text
    const truncatedContent = content.length > MAX_EMBED_CHARS
      ? content.slice(0, MAX_EMBED_CHARS) + " [truncated for embedding]"
      : content;
    // Strip non-printable characters that inflate token count in PDF extractions
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
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: textToEmbed,
      }),
    });

    if (!embeddingRes.ok) {
      const err = await embeddingRes.text();
      return res.status(500).json({ error: "OpenAI embedding failed: " + err.slice(0, 200) });
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding) {
      return res.status(500).json({ error: "No embedding returned from OpenAI" });
    }

    // ── Step 2: Upsert into Supabase ───────────────────────────────────────
    // If id is provided and exists, update. Otherwise insert new row.
    const payload = {
      title,
      category:     category     || "Compliance",
      jurisdiction: jurisdiction || "All",
      priority:     priority     || 50,
      triggers:     triggers     || [],
      content,
      embedding,
      status:       status       || "active",
    };

    // Include id only if provided (for updates)
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
