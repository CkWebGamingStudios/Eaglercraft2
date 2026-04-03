const ADMIN_COOKIE = "eagler_admin_session";

// --- UTILITY FUNCTIONS ---

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

function parseCookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(
    raw.split(";").map((p) => p.trim()).filter(Boolean).map((cookie) => {
      const idx = cookie.indexOf("=");
      if (idx < 0) return [cookie, ""];
      let val = cookie.slice(idx + 1);
      try { val = decodeURIComponent(val); } catch (e) {}
      return [cookie.slice(0, idx), val];
    })
  );
}

const sessionCookie = (token, secure) => 
  `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${secure ? "; Secure" : ""}; SameSite=Lax; Max-Age=${60 * 60 * 24}`;

const clearSessionCookie = (secure) => 
  `${ADMIN_COOKIE}=; Path=/; HttpOnly${secure ? "; Secure" : ""}; SameSite=Lax; Max-Age=0`;

const usersKv = (env) => env.ELGE_USERS_KV || env.USER_PROFILE_KV;
const forumsKv = (env) => env.ELGE_FORUMS;
const modsKv = (env) => env.ELGE_MODDIT || env.ELGE_FORUMS;
const errorLogsKv = (env) => env.ERROR_LOGS || env.ELGE_USERS_KV;

async function listAll(kv, prefix) {
  if (!kv?.list) return [];
  const out = [];
  let cursor;
  do {
    const res = await kv.list({ prefix, cursor });
    out.push(...(res?.keys || []));
    cursor = res?.list_complete ? undefined : res?.cursor;
  } while (cursor);
  return out;
}

async function requireAdmin(request, env) {
  const kv = usersKv(env);
  if (!kv) return { ok: false, response: json({ error: "Users KV not bound" }, 500) };
  const token = parseCookies(request)[ADMIN_COOKIE];
  if (!token) return { ok: false, response: json({ error: "Admin auth required" }, 401) };
  const session = await kv.get(`admin:session:${token}`);
  if (!session) return { ok: false, response: json({ error: "Admin session expired" }, 401) };
  return { ok: true, kv, token };
}

// --- MAIN HANDLER ---

export async function onRequest(context) {
  const { request, env, params } = context;
  const isSecure = new URL(request.url).protocol === "https:";
  const rawPath = params?.path;
  const tail = Array.isArray(rawPath) ? rawPath.filter(Boolean) : (typeof rawPath === "string" ? rawPath.split("/").filter(Boolean) : []);
  const action = tail[0] || "";

  // 1. PUBLIC ROUTES (Login/Logout)
  if (request.method === "POST" && action === "login") {
    let body;
    try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
    if (!env.ADMIN_PASS) return json({ error: "ADMIN_PASS not configured" }, 500);
    if ((body?.password || "") !== env.ADMIN_PASS) return json({ error: "Invalid password" }, 401);

    const kv = usersKv(env);
    if (!kv) return json({ error: "Users KV not bound" }, 500);
    const token = `${crypto.randomUUID()}-${Date.now()}`;
    await kv.put(`admin:session:${token}`, JSON.stringify({ createdAt: Date.now() }), { expirationTtl: 86400 });
    return json({ success: true }, 200, { "Set-Cookie": sessionCookie(token, isSecure) });
  }

  if (request.method === "POST" && action === "logout") {
    const kv = usersKv(env);
    const token = parseCookies(request)[ADMIN_COOKIE];
    if (kv && token) await kv.delete(`admin:session:${token}`);
    return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie(isSecure) });
  }

  // 2. ADMIN AUTH CHECK
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return admin.response;
  const usersStore = admin.kv;

  // 3. PROTECTED ROUTES

  // --- HEALTH & MAINTENANCE (From kv-health.js and states.js) ---
  if (request.method === "GET" && action === "kv-health") {
    const stateKeys = await usersStore.list({ prefix: "auth:state:" });
    const sessionKeys = await usersStore.list({ prefix: "auth:session:" });
    const userKeys = await usersStore.list({ prefix: "auth:user:" });
    return json({
      success: true,
      result: {
        staleStates: stateKeys.keys.length,
        activeSessions: sessionKeys.keys.length,
        totalUsers: userKeys.keys.length,
        healthy: stateKeys.keys.length === 0,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (request.method === "POST" && action === "states" && tail[1] === "clear") {
    const stateKeys = await listAll(usersStore, "auth:state:");
    for (const key of stateKeys) { await usersStore.delete(key.name); }
    return json({ success: true, message: `Deleted ${stateKeys.length} stale states` });
  }

  // --- USER MANAGEMENT ---
  if (request.method === "GET" && action === "users") {
    const keys = await listAll(usersStore, "auth:user:");
    const users = [];
    for (const key of keys) {
      const raw = await usersStore.get(key.name);
      if (!raw) continue;
      try {
        const p = JSON.parse(raw);
        users.push({ uid: p.uid, username: p.username || "User", email: p.email || "", provider: p.provider || "", updatedAt: p.updatedAt || "" });
      } catch { }
    }
    return json({ success: true, result: users });
  }

  if (request.method === "DELETE" && action === "users" && tail[1]) {
    const uid = tail[1];
    const profileRaw = await usersStore.get(`auth:user:${uid}`);
    if (!profileRaw) return json({ error: "User not found" }, 404);
    let p = JSON.parse(profileRaw);
    await usersStore.delete(`auth:user:${uid}`);
    await usersStore.delete(uid);
    if (p.provider && p.providerId) await usersStore.delete(`auth:map:${p.provider}:${p.providerId}`);
    if (p.email) await usersStore.delete(`auth:email:${String(p.email).trim().toLowerCase()}`);
    return json({ success: true });
  }

  // --- FORUMS & MODS ---
  if (request.method === "GET" && (action === "posts" || action === "mods")) {
    const kv = action === "posts" ? forumsKv(env) : modsKv(env);
    const key = action === "posts" ? "posts" : "moddit:mods";
    const data = (await kv.get(key, "json")) || [];
    return json({ success: true, result: data });
  }

  // --- ERROR LOGS ---
  const logKv = errorLogsKv(env);
  if (action === "logs") {
    if (!logKv) return json({ error: "Log KV not bound" }, 500);

    if (request.method === "GET" && tail[1] === "stats") {
      const keys = await listAll(logKv, "error:");
      const stats = { totalErrors: keys.length, errorsByType: {}, errorsByPath: {}, recentErrors: [] };
      // Sample logic here...
      return json({ success: true, result: stats });
    }

    if (request.method === "GET" && !tail[1]) {
      const url = new URL(request.url);
      const res = await logKv.list({ prefix: "error:index:", limit: 50, cursor: url.searchParams.get("cursor") });
      const logs = [];
      for (const k of res.keys) {
        const id = await logKv.get(k.name);
        const data = await logKv.get(`error:${id}`);
        if (data) logs.push(JSON.parse(data));
      }
      return json({ success: true, result: { logs, hasMore: !res.list_complete, cursor: res.cursor } });
    }

    if (request.method === "DELETE" && !tail[1]) {
      const keys = await listAll(logKv, "error:");
      for (const k of keys) { await logKv.delete(k.name); }
      return json({ success: true });
    }
  }

  if (request.method === "GET" && action === "status") return json({ success: true, authenticated: true });

  return json({ error: "Route not found" }, 404);
}
