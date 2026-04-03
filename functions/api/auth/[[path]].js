const SESSION_COOKIE = "eagler_session";

// Helper: JSON Response
const json = (data, status = 200) => new Response(JSON.stringify(data), { 
  status, headers: { "Content-Type": "application/json" } 
});

// Helper: Cookie Parser
function getCookies(request) {
  const cookieHeader = request.headers.get("Cookie") || "";
  return Object.fromEntries(cookieHeader.split(";").map(c => {
    const [k, ...v] = c.trim().split("=");
    return [k, decodeURIComponent(v.join("="))];
  }));
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";
  const action = params.path?.[0];
  const provider = params.path?.[1];
  const kv = env.ELGE_USERS_KV || env.USER_PROFILE_KV;

  // --- LOGIN REDIRECT ---
  if (action === "login" && provider) {
    const clientId = provider === "google" ? env.GOOGLE_CLIENT_ID : env.GITHUB_CLIENT_ID;
    const authUrl = provider === "google" 
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=code&scope=openid%20email%20profile&redirect_uri=${url.origin}/api/auth/callback/google`
      : `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=read:user%20user:email`;
    
    return Response.redirect(authUrl, 302);
  }

  // --- CALLBACK HANDLER ---
  if (action === "callback" && provider) {
    const code = url.searchParams.get("code");
    // (Note: In a full prod app, you'd exchange the code for a token here)
    // For now, we simulate the session creation:
    const sessionToken = crypto.randomUUID();
    const userId = "user_" + crypto.randomUUID().slice(0, 8);
    
    await kv.put(`auth:session:${sessionToken}`, JSON.stringify({ uid: userId }), { expirationTtl: 2592000 });

    return new Response(null, {
      status: 302,
      headers: { 
        "Location": "/", 
        "Set-Cookie": `${SESSION_COOKIE}=${sessionToken}; Path=/; HttpOnly; ${isSecure ? "Secure;" : ""} Max-Age=2592000` 
      }
    });
  }

  // --- GET CURRENT USER ---
  if (action === "me") {
    const token = getCookies(request)[SESSION_COOKIE];
    if (!token) return json({ error: "Not logged in" }, 401);
    const session = await kv.get(`auth:session:${token}`, "json");
    if (!session) return json({ error: "Session expired" }, 401);
    return json({ user: session });
  }

  return json({ error: "Auth route not found" }, 404);
}
