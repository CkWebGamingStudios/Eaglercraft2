const ADMIN_COOKIE = "eagler_admin_session";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  });
}

function parseCookies(request) {
  const raw = request.headers.get("cookie") || "";
  return Object.fromEntries(
    raw
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean)
      .map((cookie) => {
        const idx = cookie.indexOf("=");
        if (idx < 0) return [cookie, ""];
        return [cookie.slice(0, idx), decodeURIComponent(cookie.slice(idx + 1))];
      })
  );
}

function sessionCookie(token, secure) {
  const securePart = secure ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=${60 * 60 * 24}`;
}

function clearSessionCookie(secure) {
  const securePart = secure ? "; Secure" : "";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=0`;
}

function usersKv(env) {
  return env.ELGE_USERS_KV || env.USER_PROFILE_KV;
}

function forumsKv(env) {
  return env.ELGE_FORUMS;
}

function modsKv(env) {
  return env.ELGE_MODDIT || env.ELGE_FORUMS;
}

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

export async function onRequest(context) {
  const { request, env, params } = context;
  const isSecure = new URL(request.url).protocol === "https:";
  const rawPath = params?.path;
  const tail = Array.isArray(rawPath)
    ? rawPath.filter(Boolean)
    : (typeof rawPath === "string" ? rawPath.split("/").filter(Boolean) : []);
  const action = tail[0] || "";

  if (request.method === "POST" && action === "login") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    if (!env.ADMIN_PASS) {
      return json({ error: "ADMIN_PASS is not configured" }, 500);
    }

    if ((body?.password || "") !== env.ADMIN_PASS) {
      return json({ error: "Invalid admin password" }, 401);
    }

    const kv = usersKv(env);
    if (!kv) return json({ error: "Users KV not bound" }, 500);

    const token = `${crypto.randomUUID()}-${Date.now()}`;
    await kv.put(`admin:session:${token}`, JSON.stringify({ createdAt: Date.now() }), { expirationTtl: 60 * 60 * 24 });

    return json({ success: true }, 200, { "Set-Cookie": sessionCookie(token, isSecure) });
  }

  if (request.method === "POST" && action === "logout") {
    const kv = usersKv(env);
    const token = parseCookies(request)[ADMIN_COOKIE];
    if (kv && token) {
      await kv.delete(`admin:session:${token}`);
    }
    return json({ success: true }, 200, { "Set-Cookie": clearSessionCookie(isSecure) });
  }

  const admin = await requireAdmin(request, env);
  if (!admin.ok) {
    return admin.response;
  }

  const usersStore = admin.kv;

  if (request.method === "GET" && action === "status") {
    return json({ success: true, authenticated: true });
  }

  if (request.method === "GET" && action === "users") {
    const keys = await listAll(usersStore, "auth:user:");
    const users = [];
    for (const key of keys) {
      const raw = await usersStore.get(key.name);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        users.push({
          uid: parsed.uid,
          username: parsed.username || "User",
          email: parsed.email || "",
          provider: parsed.provider || "",
          updatedAt: parsed.updatedAt || ""
        });
      } catch {
        // ignore
      }
    }
    return json({ success: true, result: users });
  }

  if (request.method === "DELETE" && action === "users" && tail[1]) {
    const uid = tail[1];
    const profileRaw = await usersStore.get(`auth:user:${uid}`);
    if (!profileRaw) return json({ error: "User not found" }, 404);

    let profile = {};
    try {
      profile = JSON.parse(profileRaw);
    } catch {
      profile = {};
    }

    await usersStore.delete(`auth:user:${uid}`);
    await usersStore.delete(uid);

    if (profile.provider && profile.providerId) {
      await usersStore.delete(`auth:map:${profile.provider}:${profile.providerId}`);
    }
    if (profile.email) {
      await usersStore.delete(`auth:email:${String(profile.email).trim().toLowerCase()}`);
    }

    const sessionKeys = await listAll(usersStore, "auth:session:");
    for (const key of sessionKeys) {
      const raw = await usersStore.get(key.name);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        if (parsed.uid === uid) {
          await usersStore.delete(key.name);
        }
      } catch {
        // ignore
      }
    }

    return json({ success: true });
  }

  if (request.method === "GET" && action === "posts") {
    const kv = forumsKv(env);
    if (!kv) return json({ error: "Forums KV not bound" }, 500);
    const posts = (await kv.get("posts", "json")) || [];
    return json({ success: true, result: posts });
  }

  if (request.method === "DELETE" && action === "posts" && tail[1]) {
    const kv = forumsKv(env);
    if (!kv) return json({ error: "Forums KV not bound" }, 500);
    const posts = (await kv.get("posts", "json")) || [];
    const next = posts.filter((entry) => entry.id !== tail[1]);
    if (next.length === posts.length) return json({ error: "Post not found" }, 404);
    await kv.put("posts", JSON.stringify(next));
    return json({ success: true });
  }

  if (request.method === "GET" && action === "mods") {
    const kv = modsKv(env);
    if (!kv) return json({ error: "Mods KV not bound" }, 500);
    const mods = (await kv.get("moddit:mods", "json")) || [];
    return json({ success: true, result: mods });
  }

  if (request.method === "DELETE" && action === "mods" && tail[1]) {
    const kv = modsKv(env);
    if (!kv) return json({ error: "Mods KV not bound" }, 500);
    const mods = (await kv.get("moddit:mods", "json")) || [];
    const next = mods.filter((entry) => entry.id !== tail[1]);
    if (next.length === mods.length) return json({ error: "Mod not found" }, 404);
    await kv.put("moddit:mods", JSON.stringify(next));
    return json({ success: true });
  }

  return json({ error: "Admin route not found" }, 404);
}
