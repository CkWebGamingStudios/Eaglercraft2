async function requireAdmin(request, env) {
  const kv = env.ELGE_USERS_KV || env.USER_PROFILE_KV;
  if (!kv) return { ok: false, response: json({ error: "KV not bound" }, 500) };
  
  const cookies = parseCookies(request);
  const token = cookies.eagler_admin_session;
  if (!token) return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  
  const session = await kv.get(`admin:session:${token}`);
  if (!session) return { ok: false, response: json({ error: "Session expired" }, 401) };
  
  return { ok: true, kv };
}

function parseCookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(
    raw.split(";").map((p) => p.trim()).filter(Boolean).map((cookie) => {
      const idx = cookie.indexOf("=");
      if (idx < 0) return [cookie, ""];
      return [cookie.slice(0, idx), decodeURIComponent(cookie.slice(idx + 1))];
    })
  );
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  
  const admin = await requireAdmin(request, env);
  if (!admin.ok) return admin.response;
  
  const kv = admin.kv;
  
  // List all state keys
  const stateKeys = [];
  let cursor;
  
  do {
    const result = await kv.list({ prefix: "auth:state:", cursor });
    stateKeys.push(...(result?.keys || []));
    cursor = result?.list_complete ? undefined : result?.cursor;
  } while (cursor);
  
  // Delete all of them
  let deleted = 0;
  for (const key of stateKeys) {
    await kv.delete(key.name);
    deleted++;
  }
  
  return json({
    success: true,
    message: `Deleted ${deleted} stale OAuth state entries`,
    deleted
  });
}
