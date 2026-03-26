function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const posts = (await kv.get("posts", "json")) || [];
  const postIndex = posts.findIndex((entry) => entry.id === params.id);
  if (postIndex < 0) {
    return json({ error: "Post not found" }, 404);
  }

  const post = posts[postIndex];
  if ((body.authorId || "") !== post.authorId) {
    return json({ error: "Forbidden" }, 403);
  }

  posts.splice(postIndex, 1);
  await kv.put("posts", JSON.stringify(posts));

  return json({ success: true });
}
