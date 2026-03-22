export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  const id = params.id;
  const postKey = `post:${id}`;

  if (request.method === "GET") {
    const post = await kv.get(postKey, "json");
    if (!post) return json({ error: "Post not found" }, 404);
    return json(post);
  }

  if (request.method === "POST") {
    const body = await request.json();
    if (body.action === "upvote") {
      const post = await kv.get(postKey, "json");
      if (!post) return json({ error: "Post not found" }, 404);

      post.upvotes = (post.upvotes || 0) + 1;
      await kv.put(postKey, JSON.stringify(post));
      return json({ success: true, upvotes: post.upvotes });
    }
  }

  return json({ error: "Method not allowed" }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}