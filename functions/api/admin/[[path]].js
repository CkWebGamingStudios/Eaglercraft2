const ADMIN_COOKIE = "eagler_admin_session";

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), { 
  status, headers: { "Content-Type": "application/json", ...headers } 
});

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
  const action = params.path?.[0];
  const kv = env.ELGE_USERS_KV || env.USER_PROFILE_KV;
  const logKv = env.ERROR_LOGS || kv;

  // 1. PUBLIC ADMIN LOGIN (Verify Password)
  if (request.method === "POST" && action === "login") {
    const { password } = await request.json();
    if (password !== env.ADMIN_PASS) return json({ error: "Invalid Password" }, 401);
    
    const adminToken = crypto.randomUUID();
    await kv.put(`admin:session:${adminToken}`, "true", { expirationTtl: 86400 });
    
    return json({ success: true }, 200, {
      "Set-Cookie": `${ADMIN_COOKIE}=${adminToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    });
  }

  // 2. SECURITY GATEKEEPER (Verify Admin Token for everything below)
  const token = getCookies(request)[ADMIN_COOKIE];
  const isAdmin = await kv.get(`admin:session:${token}`);
  if (!isAdmin) return json({ error: "Admin access required" }, 401);

  // 3. ADMIN ACTIONS
  
  // GET /api/admin/users
  if (action === "users" && request.method === "GET") {
    const list = await kv.list({ prefix: "auth:user:" });
    const users = [];
    for (const key of list.keys) {
      const u = await kv.get(key.name, "json");
      if (u) users.push(u);
    }
    return json({ result: users });
  }

  // POST /api/admin/states/clear
  if (action === "states" && params.path?.[1] === "clear") {
    const states = await kv.list({ prefix: "auth:state:" });
    for (const s of states.keys) { await kv.delete(s.name); }
    return json({ message: `Cleared ${states.keys.length} stale states` });
  }

  // GET /api/admin/logs/stats
  if (action === "logs" && params.path?.[1] === "stats") {
    const logs = await logKv.list({ prefix: "error:" });
    return json({ result: { totalErrors: logs.keys.length } });
  }

  // DELETE /api/admin/logs (Clear All)
  if (action === "logs" && request.method === "DELETE") {
    const logs = await logKv.list({ prefix: "error:" });
    for (const l of logs.keys) { await logKv.delete(l.name); }
    return json({ success: true });
  }

  return json({ error: "Admin endpoint not found" }, 404);
}
