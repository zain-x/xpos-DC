
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req) => {
  // Handle CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const { prompt, modelId } = await req.json();
    const apiKey = Deno.env.get("OPENROUTER_KEY");

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server Error: Missing API Key" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://deno-xpostr.deno.dev",
        "X-Title": "xPostr Deno",
      },
      body: JSON.stringify({
        model: modelId || "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "system",
            content: "You are an expert social media content generator. Output ONLY the raw tweet text. No intro, no quotes."
          },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'OpenRouter API Error');
    }

    const content = data.choices[0].message.content;

    return new Response(JSON.stringify({ content }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

