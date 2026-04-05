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
    if (result?.keys) keys.push(...result.keys);
    cursor = result?.list_complete ? undefined : result?.cursor;
  } while (cursor);
  return keys;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const url = new URL(request.url);
  const tail = params.path || [];
  const action = tail[0];
  
  // MATCHED BINDINGS FROM YOUR SETTINGS
  const usersKv = env.ELGE_USERS_KV;
  const forumsKv = env.ELGE_FORUMS;
  const modsKv = env.ELGE_MODDIT;
  const logKv = env.ERROR_LOGS;

  // 1. PUBLIC ADMIN LOGIN
  if (request.method === "POST" && action === "login") {
    const { password } = await request.json();
    // Using ADMIN_PASS from your "Variables and Secrets" section
    if (password !== env.ADMIN_PASS) return json({ error: "Invalid Password" }, 401);
    
    const adminToken = crypto.randomUUID();
    await usersKv.put(`admin:session:${adminToken}`, "true", { expirationTtl: 86400 });
    
    return json({ success: true }, 200, {
      "Set-Cookie": `${ADMIN_COOKIE}=${adminToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    });
  }

  // 2. LOGOUT HANDLER
  if (request.method === "POST" && action === "logout") {
    const token = getCookies(request)[ADMIN_COOKIE];
    if (token) await usersKv.delete(`admin:session:${token}`);
    return json({ success: true }, 200, { 
      "Set-Cookie": `${ADMIN_COOKIE}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax` 
    });
  }

  // 3. STATUS CHECK (Must be BEFORE Security Gatekeeper to prevent 401 on check)
  if (request.method === "GET" && action === "status") {
    const token = getCookies(request)[ADMIN_COOKIE];
    if (!token) return json({ authenticated: false }, 200);
    const session = await usersKv.get(`admin:session:${token}`);
    if (!session) return json({ authenticated: false }, 200);
    return json({ success: true, authenticated: true });
  }

  // 4. SECURITY GATEKEEPER
  const token = getCookies(request)[ADMIN_COOKIE];
  const isAdmin = await usersKv.get(`admin:session:${token}`);
  if (!isAdmin) return json({ error: "Admin access required" }, 401);

  // 5. PROTECTED ADMIN ROUTES

  // GET /api/admin/users
  if (action === "users" && request.method === "GET") {
    const keys = await listAll(usersKv, "auth:user:");
    const users = [];
    for (const key of keys) {
      const u = await usersKv.get(key.name, "json");
      if (u) users.push(u);
    }
    return json({ success: true, result: users });
  }

  // GET /api/admin/posts
  if (action === "posts" && request.method === "GET") {
    if (!forumsKv) return json({ error: "ELGE_FORUMS binding missing" }, 500);
    const posts = (await forumsKv.get("posts", "json")) || [];
    return json({ success: true, result: posts });
  }

  // GET /api/admin/mods
  if (action === "mods" && request.method === "GET") {
    if (!modsKv) return json({ error: "ELGE_MODDIT binding missing" }, 500);
    const mods = (await modsKv.get("moddit:mods", "json")) || [];
    return json({ success: true, result: mods });
  }

  // GET /api/admin/logs
  if (action === "logs" && request.method === "GET") {
    if (!logKv) return json({ error: "ERROR_LOGS binding missing" }, 500);
    
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

  // POST /api/admin/cleanup-states
  if (request.method === "POST" && action === "cleanup-states") {
    const keys = await listAll(usersKv, "auth:state:");
    for (const key of keys) await usersKv.delete(key.name);
    return json({ success: true, deleted: keys.length });
  }

  // GET /api/admin/kv-health
  if (request.method === "GET" && action === "kv-health") {
    const states = await usersKv.list({ prefix: "auth:state:" });
    const sessions = await usersKv.list({ prefix: "auth:session:" });
    const users = await usersKv.list({ prefix: "auth:user:" });
    return json({
      success: true,
      result: {
        staleStates: states.keys.length,
        activeSessions: sessions.keys.length,
        totalUsers: users.keys.length,
        healthy: states.keys.length === 0,
        timestamp: new Date().toISOString()
      }
    });
  }

  // 6. CATCH-ALL 404
  return json({ error: `Admin route '/api/admin/${action}' not found` }, 404);
}
