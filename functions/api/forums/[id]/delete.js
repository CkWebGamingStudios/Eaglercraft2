export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  if (request.method !== "DELETE")
    return json({ error: "Method not allowed" }, 405);

  const body = await request.json();
  const postKey = `post:${params.id}`;
  const post = await kv.get(postKey, "json");

  if (!post) return json({ error: "Post not found" }, 404);
  if (post.authorId !== body.authorId)
    return json({ error: "Forbidden" }, 403);

  // delete post
  await kv.delete(postKey);

  // delete comments
  const prefix = `post:${params.id}:comment:`;
  const list = await kv.list({ prefix });
  for (const key of list.keys) {
    await kv.delete(key.name);
  }

  return json({ success: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}