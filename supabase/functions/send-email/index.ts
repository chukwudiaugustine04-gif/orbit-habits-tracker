const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SENDER_NAME = "Orbit";
const SENDER_EMAIL = "onboarding@resend.dev";
const SENDER = `${SENDER_NAME} <${SENDER_EMAIL}>`;

interface EmailRequest {
  to: string;
  subject: string;
  type: "signup" | "reset";
  code?: string;
  userName?: string;
}

function buildHtmlContent(type: string, code: string | undefined, userName: string | undefined): string {
  const greeting = userName ? `Hi ${userName},` : "Hello,";
  const codeBlock = code
    ? `<div style="margin:32px 0;text-align:center"><div style="display:inline-block;font-size:36px;font-weight:700;letter-spacing:12px;color:#06b6d4;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:16px 32px">${code}</div></div>`
    : "";

  if (type === "signup") {
    return `<div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0f1424;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;color:#e2e8f0">
      <div style="text-align:center;margin-bottom:32px"><span style="font-size:24px;font-weight:700;color:#06b6d4">Orbit</span><p style="font-size:13px;color:#94a3b8;margin:4px 0 0">Your habit in orbit</p></div>
      <h2 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 16px">Verify your email</h2>
      <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 8px">${greeting}</p>
      <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 8px">Welcome to Orbit! Use the code below to verify your email address and activate your account.</p>
      ${codeBlock}
      <p style="font-size:13px;color:#64748b;margin:24px 0 0">This code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0" />
      <p style="font-size:12px;color:#475569;margin:0">Sent by Orbit &lt;${SENDER_EMAIL}&gt;</p>
    </div>`;
  }

  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;background:#0f1424;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;color:#e2e8f0">
    <div style="text-align:center;margin-bottom:32px"><span style="font-size:24px;font-weight:700;color:#06b6d4">Orbit</span><p style="font-size:13px;color:#94a3b8;margin:4px 0 0">Your habit in orbit</p></div>
    <h2 style="font-size:20px;font-weight:600;color:#fff;margin:0 0 16px">Reset your password</h2>
    <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 8px">${greeting}</p>
    <p style="font-size:15px;line-height:1.6;color:#94a3b8;margin:0 0 8px">We received a request to reset your Orbit password. Use the code below to continue.</p>
    ${codeBlock}
    <p style="font-size:13px;color:#64748b;margin:24px 0 0">This code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.</p>
    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0" />
    <p style="font-size:12px;color:#475569;margin:0">Sent by Orbit &lt;${SENDER_EMAIL}&gt;</p>
  </div>`;
}

function buildTextContent(type: string, code: string | undefined, userName: string | undefined): string {
  const greeting = userName ? `Hi ${userName},` : "Hello,";
  if (type === "signup") {
    return `${greeting}\n\nWelcome to Orbit! Your verification code is: ${code || ""}\n\nThis code expires in 10 minutes. If you didn't create an account, you can safely ignore this email.\n\nSent by Orbit <${SENDER_EMAIL}>`;
  }
  return `${greeting}\n\nWe received a request to reset your Orbit password. Your verification code is: ${code || ""}\n\nThis code expires in 10 minutes. If you didn't request a password reset, you can safely ignore this email.\n\nSent by Orbit <${SENDER_EMAIL}>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json() as EmailRequest;

    if (!body.to || !body.to.includes("@")) {
      return new Response(
        JSON.stringify({ error: "A valid recipient email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!body.type || (body.type !== "signup" && body.type !== "reset")) {
      return new Response(
        JSON.stringify({ error: "Email type must be 'signup' or 'reset'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const subject = body.type === "signup"
      ? "Verify your Orbit account"
      : "Reset your Orbit password";

    const code = body.code || "1234";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured — email not sent (mock mode)");
      return new Response(
        JSON.stringify({ success: true, id: "mock", sender: SENDER, mocked: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const emailPayload = {
      from: SENDER,
      to: body.to,
      subject,
      html: buildHtmlContent(body.type, code, body.userName),
      text: buildTextContent(body.type, code, body.userName),
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `Resend API error: ${response.status} ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({ success: true, id: data.id, sender: SENDER }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
