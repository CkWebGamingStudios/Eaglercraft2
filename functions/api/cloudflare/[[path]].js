const API_ORIGIN = "https://api.cloudflare.com/client/v4";

function buildCorsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export async function onRequest(context) {
  const { request, params, env } = context;
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

  const token = env.CF_API_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: "Missing CF_API_TOKEN secret in Cloudflare Pages environment." }]
      }),
      {
        status: 500,
        headers: {
          ...buildCorsHeaders(origin),
          "Content-Type": "application/json"
        }
      }
    );
  }

  const path = Array.isArray(params.path) ? params.path.join("/") : params.path;
  const incomingUrl = new URL(request.url);
  const targetUrl = `${API_ORIGIN}/${path || ""}${incomingUrl.search}`;

  const upstreamResponse = await fetch(targetUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json"
    }
  });

  const body = await upstreamResponse.text();

  return new Response(body, {
    status: upstreamResponse.status,
    headers: {
      ...buildCorsHeaders(origin),
      "Content-Type": upstreamResponse.headers.get("Content-Type") || "application/json"
    }
  });
}
