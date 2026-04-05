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

// Helper to list all keys in a KV namespace
async function listAll(kv, prefix) {
  const keys = [];
  let cursor;
  do {
    const result = await kv.list({ prefix, cursor });
    keys.push(...(result?.keys || []));
    cursor = result?.list_complete ? undefined : result?.cursor;
  } while (cursor);
  return keys;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const tail = params.path || [];
  const action = tail[0];
  
  // KV Bindings - Adjust based on your wrangler.toml
  const kv = env.ELGE_USERS_KV || env.USER_PROFILE_KV;
  const forumKv = env.FORUMS_KV;
  const modsKv = env.MODS_KV;
  const logKv = env.ERROR_LOGS || kv;

  // 1. PUBLIC ADMIN LOGIN
  if (request.method === "POST" && action === "login") {
    const { password } = await request.json();
    if (password !== env.ADMIN_PASS) return json({ error: "Invalid Password" }, 401);
    
    const adminToken = crypto.randomUUID();
    await kv.put(`admin:session:${adminToken}`, "true", { expirationTtl: 86400 });
    
    return json({ success: true }, 200, {
      "Set-Cookie": `${ADMIN_COOKIE}=${adminToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    });
  }

  // 2. LOGOUT HANDLER
  if (request.method === "POST" && action === "logout") {
    const token = getCookies(request)[ADMIN_COOKIE];
    if (token) await kv.delete(`admin:session:${token}`);
    return json({ success: true }, 200, { 
      "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax` 
    });
  }

  // 3. STATUS CHECK (Must be BEFORE Security Gatekeeper)
  if (request.method === "GET" && action === "status") {
    const token = getCookies(request)[ADMIN_COOKIE];
    if (!token) return json({ authenticated: false }, 200);
    const session = await kv.get(`admin:session:${token}`);
    if (!session) return json({ authenticated: false }, 200);
    return json({ success: true, authenticated: true });
  }

  // 4. SECURITY GATEKEEPER
  const token = getCookies(request)[ADMIN_COOKIE];
  const isAdmin = await kv.get(`admin:session:${token}`);
  if (!isAdmin) return json({ error: "Admin access required" }, 401);

  // 5. PROTECTED ADMIN ROUTES

  // USERS
  if (action === "users" && request.method === "GET") {
    const keys = await listAll(kv, "auth:user:");
    const users = [];
    for (const key of keys) {
      const u = await kv.get(key.name, "json");
      if (u) users.push(u);
    }
    return json({ success: true, result: users });
  }

  // POSTS
  if (action === "posts" && request.method === "GET") {
    if (!forumKv) return json({ error: "Forums KV not bound" }, 500);
    const posts = (await forumKv.get("posts", "json")) || [];
    return json({ success: true, result: posts });
  }

  // MODS
  if (action === "mods" && request.method === "GET") {
    if (!modsKv) return json({ error: "Mods KV not bound" }, 500);
    const mods = (await modsKv.get("moddit:mods", "json")) || [];
    return json({ success: true, result: mods });
  }

  // LOGS (Detailed List)
  if (action === "logs" && request.method === "GET") {
    if (tail[1] === "stats") {
      const logs = await logKv.list({ prefix: "error:" });
      return json({ success: true, result: { totalErrors: logs.keys.length } });
    }
    
    const limit = parseInt(url.searchParams.get("limit")) || 50;
    const indexList = await logKv.list({ prefix: "error:index:", limit });
    const logs = [];
    for (const key of indexList.keys) {
      const rayId = await logKv.get(key.name);
      const data = await logKv.get(`error:${rayId}`, "json");
      if (data) logs.push(data);
    }
    return json({ success: true, result: { logs } });
  }

  // CLEANUP & HEALTH
  if (request.method === "POST" && action === "cleanup-states") {
    const keys = await listAll(kv, "auth:state:");
    for (const key of keys) await kv.delete(key.name);
    return json({ success: true, deleted: keys.length });
  }

  if (request.method === "GET" && action === "kv-health") {
    const states = await kv.list({ prefix: "auth:state:" });
    const sessions = await kv.list({ prefix: "auth:session:" });
    return json({
      success: true,
      result: {
        staleStates: states.keys.length,
        activeSessions: sessions.keys.length,
        healthy: states.keys.length === 0,
        timestamp: new Date().toISOString()
      }
    });
  }

  // 6. CATCH-ALL 404 (MUST BE LAST)
  return json({ error: `Admin route '/api/admin/${action}' not found` }, 404);
}
