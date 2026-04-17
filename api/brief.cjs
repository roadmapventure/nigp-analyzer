module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 3000,
        system: req.body?.system || "",
        messages: req.body?.messages || [],
      }),
    });

    const text = await response.text();
    console.log("Anthropic status:", response.status);
    console.log("Anthropic response:", text.slice(0, 200));

    try {
      const data = JSON.parse(text);
      return res.status(response.status).json(data);
    } catch(parseErr) {
      return res.status(500).json({ error: "Anthropic returned non-JSON: " + text.slice(0, 200) });
    }
  } catch (err) {
    console.log("Fetch error:", err.message);
    return res.status(500).json({ error: err.message });
  }
};