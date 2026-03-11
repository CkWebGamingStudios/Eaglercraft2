function buildCorsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function jsonResponse(origin, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(origin),
      "Content-Type": "application/json"
    }
  });
}

function getKvBinding(env) {
  return env.ELGE_USERS_KV || env.USER_PROFILE_KV;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const origin = request.headers.get("Origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin)
    });
  }

  const kv = getKvBinding(env);
  if (!kv) {
    return jsonResponse(origin, 500, {
      success: false,
      errors: [{ message: "Missing KV binding. Configure ELGE_USERS_KV (or USER_PROFILE_KV) in Pages Functions." }],
      diagnostics: {
        has_ELGE_USERS_KV: Boolean(env.ELGE_USERS_KV),
        has_USER_PROFILE_KV: Boolean(env.USER_PROFILE_KV)
      }
    });
  }

  const uid = params.uid;
  if (!uid) {
    return jsonResponse(origin, 400, {
      success: false,
      errors: [{ message: "Missing uid in route" }]
    });
  }

  if (request.method === "GET") {
    const raw = await kv.get(uid);
    if (!raw) {
      return jsonResponse(origin, 404, {
        success: false,
        errors: [{ message: `No KV profile found for uid ${uid}` }]
      });
    }

    return jsonResponse(origin, 200, {
      success: true,
      result: JSON.parse(raw)
    });
  }

  if (request.method === "PUT") {
    let profile;

    try {
      profile = await request.json();
    } catch {
      return jsonResponse(origin, 400, {
        success: false,
        errors: [{ message: "Invalid JSON body" }]
      });
    }

    const normalized = {
      title: uid,
      uid,
      email: profile?.email || "",
      country: profile?.country || "",
      username: profile?.username || "",
      profilePicture: profile?.profilePicture || "",
      updatedAt: profile?.updatedAt || new Date().toISOString()
    };

    await kv.put(uid, JSON.stringify(normalized));

    return jsonResponse(origin, 200, {
      success: true,
      result: normalized
    });
  }

  return jsonResponse(origin, 405, {
    success: false,
    errors: [{ message: "Method not allowed" }]
  });
}
