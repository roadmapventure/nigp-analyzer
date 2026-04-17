// api/brief.js  — Vercel Serverless Function
// Proxies requests to Anthropic API, keeping your key server-side.
// Deploy: push to GitHub → connect to Vercel → add ANTHROPIC_API_KEY env var.

export const config = { runtime: "edge" };

export default async function handler(req) {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // CORS — allow your Vercel domain and localhost dev
  const origin = req.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://nigp.roadmapventure.com",
    "https://nigp-analyzer.vercel.app",
    process.env.ALLOWED_ORIGIN || "", // set this in Vercel env vars to your domain
  ];
  const corsOrigin = allowedOrigins.includes(origin) ? "*";

  const corsHeaders = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured on server." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Forward to Anthropic
  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await anthropicRes.json();

  return new Response(JSON.stringify(data), {
    status: anthropicRes.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

