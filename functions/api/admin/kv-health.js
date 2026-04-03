function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const { env } = context;
  const kv = env.ELGE_USERS_KV || env.USER_PROFILE_KV;
  
  if (!kv) {
    return json({ success: false, errors: [{ message: "KV not bound" }] }, 500);
  }
  
  // Count entries by type
  const stateKeys = await kv.list({ prefix: "auth:state:" });
  const sessionKeys = await kv.list({ prefix: "auth:session:" });
  const userKeys = await kv.list({ prefix: "auth:user:" });
  
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
