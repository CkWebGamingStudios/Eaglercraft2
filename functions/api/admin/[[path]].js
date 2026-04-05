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
  
  // Bindings from your screenshot
  const usersKv = env.ELGE_USERS_KV;
  const forumsKv = env.ELGE_FORUMS;
  const modsKv = env.ELGE_MODDIT;
  const logKv = env.ERROR_LOGS;

  // 1. LOGIN
  if (request.method === "POST" && action === "login") {
    const { password } = await request.json();
    if (password !== env.ADMIN_PASS) return json({ error: "Invalid Password" }, 401);
    const adminToken = crypto.randomUUID();
    await usersKv.put(`admin:session:${adminToken}`, "true", { expirationTtl: 86400 });
    return json({ success: true }, 200, {
      "Set-Cookie": `${ADMIN_COOKIE}=${adminToken}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`
    });
  }

  // 2. STATUS (BEFORE Security Gate)
  if (request.method === "GET" && action === "status") {
    const token = getCookies(request)[ADMIN_COOKIE];
    const session = token ? await usersKv.get(`admin:session:${token}`) : null;
    return json({ authenticated: !!session });
  }

  // 3. SECURITY GATE
  const token = getCookies(request)[ADMIN_COOKIE];
  const isAdmin = await usersKv.get(`admin:session:${token}`);
  if (!isAdmin) return json({ error: "Admin access required" }, 401);

  // 4. ROUTES
  if (action === "users" && request.method === "GET") {
    const keys = await listAll(usersKv, "auth:user:");
    const users = [];
    for (const k of keys) { users.push(await usersKv.get(k.name, "json")); }
    return json({ success: true, result: users });
  }

  if (action === "logs") {
    // DELETE /api/admin/logs (Clear All) or /api/admin/logs/RAY_ID
    if (request.method === "DELETE") {
      if (tail[1]) {
        await logKv.delete(`error:${tail[1]}`);
        await logKv.delete(`error:index:${tail[1]}`);
        return json({ success: true });
      }
      const keys = await listAll(logKv, "error:");
      for (const k of keys) await logKv.delete(k.name);
      return json({ success: true });
    }
    // GET /api/admin/logs
    if (request.method === "GET") {
      if (tail[1] === "stats") {
        const logs = await logKv.list({ prefix: "error:" });
        return json({ success: true, result: { totalErrors: logs.keys.length } });
      }
      const list = await logKv.list({ prefix: "error:index:", limit: 100 });
      const logs = [];
      for (const k of list.keys) {
        const id = await logKv.get(k.name);
        const data = await logKv.get(`error:${id}`, "json");
        if (data) logs.push(data);
      }
      return json({ success: true, result: { logs } });
    }
  }

  if (action === "cleanup-states" && request.method === "POST") {
    const keys = await listAll(usersKv, "auth:state:");
    for (const k of keys) await usersKv.delete(k.name);
    return json({ success: true, deleted: keys.length });
  }

  if (action === "kv-health" && request.method === "GET") {
    const states = await usersKv.list({ prefix: "auth:state:" });
    return json({ success: true, result: { staleStates: states.keys.length, healthy: states.keys.length === 0 } });
  }

  if (action === "posts" && request.method === "GET") {
    const posts = await forumsKv.get("posts", "json") || [];
    return json({ success: true, result: posts });
  }

  if (action === "mods" && request.method === "GET") {
    const mods = await modsKv.get("moddit:mods", "json") || [];
    return json({ success: true, result: mods });
  }

  return json({ error: `Route ${action} not found` }, 404);
}
