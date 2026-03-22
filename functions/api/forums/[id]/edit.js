export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  if (request.method !== "PUT")
    return json({ error: "Method not allowed" }, 405);

  const body = await request.json();
  const postKey = `post:${params.id}`;
  const post = await kv.get(postKey, "json");

  if (!post) return json({ error: "Post not found" }, 404);

  if (post.authorId !== body.authorId)
    return json({ error: "Forbidden" }, 403);

  post.title = body.title ?? post.title;
  post.content = body.content ?? post.content;
  post.image = body.image ?? post.image;
  post.links = body.links ?? post.links;
  post.updatedAt = Date.now();

  await kv.put(postKey, JSON.stringify(post));
  return json(post);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}