const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TURNSTILE_SECRET_KEY =
  Deno.env.get("CLOUDFLARE_TURNSTILE_SECRET_KEY") ||
  "1x0000000000000000000000000000000AA";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const token = body?.token;

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing Turnstile token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const formData = new FormData();
    formData.append("secret", TURNSTILE_SECRET_KEY);
    formData.append("response", token);

    const cfResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body: formData },
    );

    if (!cfResponse.ok) {
      const errText = await cfResponse.text();
      console.error("[verify-turnstile] Cloudflare request failed:", cfResponse.status, errText);
      return new Response(
        JSON.stringify({ success: false, error: "Cloudflare verification request failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const cfData = await cfResponse.json();
    console.log("[verify-turnstile] Cloudflare response:", JSON.stringify(cfData));

    if (cfData.success === true) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.error("[verify-turnstile] Verification failed. Error codes:", cfData["error-codes"]);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Turnstile verification failed",
        errors: cfData["error-codes"] || [],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[verify-turnstile] Internal error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
