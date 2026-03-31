// Global error-tracking middleware with Ray ID capture

async function logErrorToKV(errorLog, env) {
  const kv = env.ERROR_LOGS || env.ELGE_USERS_KV;
  if (!kv) {
    console.error("ERROR_LOGS KV namespace not bound");
    return;
  }

  try {
    // Store with Ray ID as key for easy lookup
    await kv.put(`error:${errorLog.rayId}`, JSON.stringify(errorLog), {
      expirationTtl: 60 * 60 * 24 * 7 // Auto-delete after 7 days
    });

    // Also maintain a sorted index by timestamp
    const indexKey = `error:index:${errorLog.timestamp}:${errorLog.rayId}`;
    await kv.put(indexKey, errorLog.rayId, {
      expirationTtl: 60 * 60 * 24 * 7
    });
  } catch (err) {
    console.error("Failed to log error to KV:", err);
  }
}

export async function onRequest(context) {
  const { request, next, env } = context;
  
  // Extract Ray ID from request headers
  const rayId = request.headers.get("cf-ray") || `local-${crypto.randomUUID()}`;
  const startTime = Date.now();

  try {
    // Proceed to the actual function
    const response = await next();
    
    // Log successful requests if they're slow (optional)
    const duration = Date.now() - startTime;
    if (duration > 5000) { // Log requests slower than 5 seconds
      const slowLog = {
        rayId,
        type: "slow_request",
        duration,
        timestamp: new Date().toISOString(),
        path: new URL(request.url).pathname,
        method: request.method,
        status: response.status
      };
      context.waitUntil(logErrorToKV(slowLog, env));
    }
    
    return response;
  } catch (err) {
    // Capture the error with full details
    const errorLog = {
      rayId,
      type: "error",
      message: err.message || "Unknown error",
      stack: err.stack || "",
      timestamp: new Date().toISOString(),
      path: new URL(request.url).pathname,
      method: request.method,
      userAgent: request.headers.get("user-agent") || "",
      referer: request.headers.get("referer") || "",
      ip: request.headers.get("cf-connecting-ip") || "",
      country: request.headers.get("cf-ipcountry") || "",
      duration: Date.now() - startTime
    };

    // Log to KV without blocking the response
    context.waitUntil(logErrorToKV(errorLog, env));

    // Return a custom error response with Ray ID
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "Something went wrong. Please contact support with this reference ID.",
        rayId: rayId,
        timestamp: errorLog.timestamp
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "X-Ray-ID": rayId
        }
      }
    );
  }
}
