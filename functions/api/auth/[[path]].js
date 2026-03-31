const DEFAULT_ACCOUNT_ID = "432016fb922777d8a5140c9b3b3d37f3";
const SESSION_COOKIE = "eagler_session";
const SESSION_EXPIRY_MS = 60 * 60 * 24 * 30 * 1000; // 30 days in milliseconds

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
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

function getKvAdapter(env) {
  const binding = env.ELGE_USERS_KV || env.USER_PROFILE_KV;
  if (binding) {
    return {
      async get(key) {
        return binding.get(key);
      },
      async put(key, value) {
        await binding.put(key, value);
      },
      async del(key) {
        await binding.delete(key);
      },
      async list(prefix, cursor) {
        const result = await binding.list({ prefix, cursor });
        return {
          keys: Array.isArray(result?.keys) ? result.keys.map((entry) => ({ name: entry.name })) : [],
          cursor: result?.list_complete ? "" : (result?.cursor || "")
        };
      }
    };
  }

  const token = env.CF_API_TOKEN;
  const namespaceId = env.CF_KV_NAMESPACE_ID;
  const accountId = env.CF_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  if (!token || !namespaceId) return null;

  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`;
  const valueBase = `${base}/values`;
  const authHeaders = { Authorization: `Bearer ${token}` };

  return {
    async get(key) {
      const response = await fetch(`${valueBase}/${encodeURIComponent(key)}`, { headers: authHeaders });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`KV API get failed: ${response.status}`);
      return response.text();
    },
    async put(key, value) {
      const response = await fetch(`${valueBase}/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { ...authHeaders, "Content-Type": "text/plain" },
        body: value
      });
      if (!response.ok) throw new Error(`KV API put failed: ${response.status}`);
    },
    async del(key) {
      await fetch(`${valueBase}/${encodeURIComponent(key)}`, { method: "DELETE", headers: authHeaders });
    },
    async list(prefix = "", cursor = "") {
      const listUrl = new URL(`${base}/keys`);
      if (prefix) listUrl.searchParams.set("prefix", prefix);
      if (cursor) listUrl.searchParams.set("cursor", cursor);
      listUrl.searchParams.set("limit", "1000");

      const response = await fetch(listUrl.toString(), { headers: authHeaders });
      if (!response.ok) throw new Error(`KV API list failed: ${response.status}`);
      const payload = await response.json();
      const result = payload?.result || [];
      const info = payload?.result_info || {};
      return {
        keys: result.map((entry) => ({ name: entry.name })),
        cursor: info?.cursor || ""
      };
    }
  };
}

function providerConfig(provider, env, origin) {
  if (provider === "google") {
    return {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      redirectUri: `${origin}/api/auth/callback/google`,
      scope: "openid email profile"
    };
  }

  if (provider === "github") {
    return {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      authUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      redirectUri: `${origin}/api/auth/callback/github`,
      scope: "read:user user:email"
    };
  }

  return null;
}

function buildSessionCookie(token, isSecure, maxAge = 60 * 60 * 24 * 30) {
  const securePart = isSecure ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=${maxAge}`;
}

function clearSessionCookie(isSecure) {
  const securePart = isSecure ? "; Secure" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly${securePart}; SameSite=Lax; Max-Age=0`;
}

function redirectWithError(origin, message) {
  const next = new URL(origin);
  next.searchParams.set("auth_error", message);
  return Response.redirect(next.toString(), 302);
}

async function readSessionUser(adapter, request) {
  const cookies = parseCookies(request);
  const sessionToken = cookies[SESSION_COOKIE];
  if (!sessionToken) return { error: "Not authenticated", status: 401 };

  const sessionRaw = await adapter.get(`auth:session:${sessionToken}`);
  if (!sessionRaw) return { error: "Session expired", status: 401 };

  const session = JSON.parse(sessionRaw);
  const userRaw = (await adapter.get(`auth:user:${session.uid}`)) || (await adapter.get(session.uid));
  if (!userRaw) return { error: "User no longer exists", status: 401, sessionToken };

  return { sessionToken, session, user: JSON.parse(userRaw) };
}

async function listKeysByPrefix(adapter, prefix) {
  const keys = [];
  let cursor = "";

  do {
    const page = await adapter.list(prefix, cursor);
    const pageKeys = Array.isArray(page?.keys) ? page.keys : [];
    keys.push(...pageKeys);
    cursor = page?.cursor || "";
  } while (cursor);

  return keys;
}

function normalizedEmail(email) {
  if (!email || typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
}

function buildGitHubHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "Eaglercraft2-Auth"
  };
}

async function parseProviderError(response, defaultMessage) {
  const body = await response.text();
  let errorMessage = defaultMessage;

  if (body) {
    try {
      const parsed = JSON.parse(body);
      const providerMessage = parsed?.error_description || parsed?.error || parsed?.message;
      if (typeof providerMessage === "string" && providerMessage.trim()) {
        errorMessage = `${defaultMessage}: ${providerMessage}`;
      }
    } catch {
      errorMessage = `${defaultMessage}: ${body.slice(0, 200)}`;
    }
  }

  return new Error(`${errorMessage} (HTTP ${response.status})`);
}

async function exchangeToken(provider, config, code) {
  if (provider === "google") {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri
      })
    });
    if (!response.ok) throw new Error("Google token exchange failed");
    return response.json();
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri
    })
  });
  if (!response.ok) throw await parseProviderError(response, "GitHub token exchange failed");
  return response.json();
}

async function fetchProviderIdentity(provider, accessToken) {
  if (provider === "google") {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error("Google user lookup failed");
    const profile = await response.json();
    return {
      providerId: profile.sub,
      email: profile.email || "",
      username: profile.name || profile.given_name || "google-user",
      profilePicture: profile.picture || ""
    };
  }

  const response = await fetch("https://api.github.com/user", {
    headers: buildGitHubHeaders(accessToken)
  });
  if (!response.ok) throw await parseProviderError(response, "GitHub user lookup failed");
  const profile = await response.json();

  let email = profile.email || "";
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: buildGitHubHeaders(accessToken)
    });
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json();
      const primary = Array.isArray(emails) ? emails.find((entry) => entry.primary) : null;
      email = primary?.email || emails?.[0]?.email || "";
    }
  }

  return {
    providerId: String(profile.id),
    email,
    username: profile.login || profile.name || "github-user",
    profilePicture: profile.avatar_url || ""
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const adapter = getKvAdapter(env);

  if (!adapter) {
    return json(500, { success: false, errors: [{ message: "Missing KV backend for auth" }] });
  }

  const url = new URL(request.url);
  const isSecure = url.protocol === "https:";
  const segments = url.pathname.split("/").filter(Boolean);
  const authIndex = segments.indexOf("auth");
  const tail = authIndex >= 0 ? segments.slice(authIndex + 1) : [];
  const action = tail[0] || "";
  const provider = tail[1] || "";

  if (request.method === "GET" && action === "users") {
    const userKeys = await listKeysByPrefix(adapter, "auth:user:");
    const sessionKeys = await listKeysByPrefix(adapter, "auth:session:");

    const onlineUidSet = new Set();
    const now = Date.now();

    for (const keyEntry of sessionKeys) {
      const sessionRaw = await adapter.get(keyEntry.name);
      if (!sessionRaw) continue;
      try {
        const parsed = JSON.parse(sessionRaw);
        if (parsed?.uid && parsed?.createdAt && (now - parsed.createdAt) < SESSION_EXPIRY_MS) {
          onlineUidSet.add(parsed.uid);
        } else if (parsed?.createdAt && (now - parsed.createdAt) >= SESSION_EXPIRY_MS) {
          await adapter.del(keyEntry.name);
        }
      } catch {
        // ignore malformed session entries
      }
    }

    const users = [];
    for (const keyEntry of userKeys) {
      const userRaw = await adapter.get(keyEntry.name);
      if (!userRaw) continue;
      try {
        const user = JSON.parse(userRaw);
        users.push({
          uid: user.uid,
          username: user.username || "User",
          profilePicture: user.profilePicture || "",
          bio: user.bio || "",
          country: user.country || "",
          updatedAt: user.updatedAt || "",
          isOnline: Boolean(user.uid && onlineUidSet.has(user.uid))
        });
      } catch {
        // ignore malformed user entries
      }
    }

    users.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return String(a.username).localeCompare(String(b.username));
    });

    return json(200, { success: true, result: users });
  }

  if (request.method === "GET" && action === "login") {
    const config = providerConfig(provider, env, url.origin);
    if (!config || !config.clientId || !config.clientSecret) {
      return redirectWithError(url.origin, `Missing OAuth config for ${provider}`);
    }

    const state = crypto.randomUUID();
    await adapter.put(`auth:state:${state}`, JSON.stringify({ provider, createdAt: Date.now() }));

    const redirect = new URL(config.authUrl);
    redirect.searchParams.set("client_id", config.clientId);
    redirect.searchParams.set("redirect_uri", config.redirectUri);
    redirect.searchParams.set("response_type", "code");
    redirect.searchParams.set("scope", config.scope);
    redirect.searchParams.set("state", state);

    return Response.redirect(redirect.toString(), 302);
  }

  if (request.method === "GET" && action === "callback") {
    const config = providerConfig(provider, env, url.origin);
    if (!config) return redirectWithError(url.origin, "Unknown provider");

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) {
      return redirectWithError(url.origin, "Missing code/state from provider callback");
    }

    const stateEntry = await adapter.get(`auth:state:${state}`);
    if (!stateEntry) return redirectWithError(url.origin, "Invalid or expired auth state");
    await adapter.del(`auth:state:${state}`);

    try {
      const tokenPayload = await exchangeToken(provider, config, code);
      const accessToken = tokenPayload.access_token;
      if (!accessToken) return redirectWithError(url.origin, "Missing access token from provider");

      const identity = await fetchProviderIdentity(provider, accessToken);
      const mapKey = `auth:map:${provider}:${identity.providerId}`;
      const mappedUid = await adapter.get(mapKey);
      const emailKey = identity.email ? `auth:email:${normalizedEmail(identity.email)}` : "";
      const emailMappedUid = emailKey ? await adapter.get(emailKey) : null;
      const existingUid = mappedUid || emailMappedUid;

      if (existingUid) {
        const existingProfileRaw = (await adapter.get(`auth:user:${existingUid}`)) || (await adapter.get(existingUid));
        if (!existingProfileRaw) {
          return redirectWithError(url.origin, "This account has been deleted and can no longer sign in.");
        }
      }

      const uid = existingUid || crypto.randomUUID();

      if (!mappedUid) {
        await adapter.put(mapKey, uid);
      }
      if (emailKey) {
        await adapter.put(emailKey, uid);
      }

      const profile = {
        title: uid,
        uid,
        email: identity.email,
        country: "",
        username: identity.username,
        profilePicture: identity.profilePicture,
        providerId: identity.providerId,
        bio: "",
        provider,
        updatedAt: new Date().toISOString()
      };

      await adapter.put(`auth:user:${uid}`, JSON.stringify(profile));
      await adapter.put(uid, JSON.stringify(profile));

      const sessionToken = `${crypto.randomUUID()}-${Date.now()}`;
      await adapter.put(`auth:session:${sessionToken}`, JSON.stringify({ uid, createdAt: Date.now() }));

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
          "Set-Cookie": buildSessionCookie(sessionToken, isSecure)
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth callback failed";
      return redirectWithError(url.origin, message);
    }
  }

  if (request.method === "GET" && action === "me") {
    const auth = await readSessionUser(adapter, request);
    if (auth.error) {
      if (auth.sessionToken) {
        await adapter.del(`auth:session:${auth.sessionToken}`);
      }
      const maybeCookie = auth.error === "User no longer exists" ? { "Set-Cookie": clearSessionCookie(isSecure) } : {};
      return json(auth.status || 401, { success: false, errors: [{ message: auth.error }] }, maybeCookie);
    }
    return json(200, { success: true, result: auth.user });
  }

  if (request.method === "GET" && action === "user" && tail[1]) {
    const targetUid = tail[1];
    const userRaw = (await adapter.get(`auth:user:${targetUid}`)) || (await adapter.get(targetUid));
    if (!userRaw) return json(404, { success: false, errors: [{ message: "User not found" }] });
    const user = JSON.parse(userRaw);
    return json(200, {
      success: true,
      result: {
        uid: user.uid,
        username: user.username,
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
        country: user.country || "",
        updatedAt: user.updatedAt || ""
      }
    });
  }

  if (request.method === "POST" && action === "profile") {
    const auth = await readSessionUser(adapter, request);
    if (auth.error) return json(auth.status, { success: false, errors: [{ message: auth.error }] });

    let patch;
    try {
      patch = await request.json();
    } catch {
      return json(400, { success: false, errors: [{ message: "Invalid JSON body" }] });
    }

    const nextProfile = {
      ...auth.user,
      username: typeof patch.username === "string" ? patch.username.trim().slice(0, 40) || auth.user.username : auth.user.username,
      profilePicture: typeof patch.profilePicture === "string" ? patch.profilePicture.trim().slice(0, 500) : auth.user.profilePicture,
      bio: typeof patch.bio === "string" ? patch.bio.trim().slice(0, 280) : (auth.user.bio || ""),
      country: typeof patch.country === "string" ? patch.country.trim().slice(0, 80) : (auth.user.country || ""),
      updatedAt: new Date().toISOString()
    };

    await adapter.put(`auth:user:${auth.user.uid}`, JSON.stringify(nextProfile));
    await adapter.put(auth.user.uid, JSON.stringify(nextProfile));
    return json(200, { success: true, result: nextProfile });
  }

  if (request.method === "DELETE" && action === "account") {
    const auth = await readSessionUser(adapter, request);
    if (auth.error) return json(auth.status, { success: false, errors: [{ message: auth.error }] });

    if (auth.sessionToken) {
      await adapter.del(`auth:session:${auth.sessionToken}`);
    }
    await adapter.del(`auth:user:${auth.user.uid}`);
    await adapter.del(auth.user.uid);

    if (auth.user.provider && auth.user.providerId) {
      await adapter.del(`auth:map:${auth.user.provider}:${auth.user.providerId}`);
    }
    const email = normalizedEmail(auth.user.email || "");
    if (email) {
      await adapter.del(`auth:email:${email}`);
    }

    return json(200, { success: true }, { "Set-Cookie": clearSessionCookie(isSecure) });
  }

  if (request.method === "POST" && action === "logout") {
    const cookies = parseCookies(request);
    const sessionToken = cookies[SESSION_COOKIE];
    if (sessionToken) {
      await adapter.del(`auth:session:${sessionToken}`);
    }

    return json(200, { success: true }, { "Set-Cookie": clearSessionCookie(isSecure) });
  }

  return json(404, { success: false, errors: [{ message: "Auth route not found" }] });
}
