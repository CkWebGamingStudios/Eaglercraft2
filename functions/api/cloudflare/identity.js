const TEAM_DOMAIN = "https://ckgamingstudios.cloudflareaccess.com";

function buildCorsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Cf-Access-Jwt-Assertion"
  };
}

function readJwtFromRequest(request) {
  const headerJwt = request.headers.get("cf-access-jwt-assertion");
  if (headerJwt) {
    return headerJwt;
  }

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  if (!match) {
    return "";
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export async function onRequest(context) {
  const { request } = context;
  const origin = request.headers.get("Origin") || "*";

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin)
    });
  }

  if (request.method !== "GET") {
    return new Response(JSON.stringify({ success: false, errors: [{ message: "Method not allowed" }] }), {
      status: 405,
      headers: {
        ...buildCorsHeaders(origin),
        "Content-Type": "application/json"
      }
    });
  }

  const jwt = readJwtFromRequest(request);
  if (!jwt) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: "Missing Cloudflare Access JWT in request headers/cookies." }]
      }),
      {
        status: 401,
        headers: {
          ...buildCorsHeaders(origin),
          "Content-Type": "application/json"
        }
      }
    );
  }

  const identityResponse = await fetch(`${TEAM_DOMAIN}/cdn-cgi/access/get-identity`, {
    method: "GET",
    headers: {
      Cookie: `CF_Authorization=${encodeURIComponent(jwt)}`,
      Accept: "application/json"
    }
  });

  const body = await identityResponse.text();
  let payload;

  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: "Cloudflare identity endpoint returned non-JSON response." }]
      }),
      {
        status: 502,
        headers: {
          ...buildCorsHeaders(origin),
          "Content-Type": "application/json"
        }
      }
    );
  }

  if (!identityResponse.ok) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: payload?.reason || payload?.message || "Unable to resolve Cloudflare identity." }],
        upstream: payload
      }),
      {
        status: identityResponse.status,
        headers: {
          ...buildCorsHeaders(origin),
          "Content-Type": "application/json"
        }
      }
    );
  }

  const uid = payload?.user_uuid || payload?.sub || payload?.email || "";

  return new Response(
    JSON.stringify({
      success: true,
      result: {
        uid,
        identity: payload
      }
    }),
    {
      status: 200,
      headers: {
        ...buildCorsHeaders(origin),
        "Content-Type": "application/json"
      }
    }
  );
}
