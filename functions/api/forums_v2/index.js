export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.ELGE_FORUMS;
  if (!kv) return json({ error: "KV not bound" }, 500);

  if (request.method === "GET") {
    const url = new URL(request.url);
    const sort = url.searchParams.get("sort") || "new";

    const list = await kv.list({ prefix: "post:" });
    const posts = [];

    for (const key of list.keys) {
      if (key.name.includes(":comment:")) continue;
      const post = await kv.get(key.name, "json");
      if (post) posts.push(post);
    }

    if (sort === "top") {
      posts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else if (sort === "hot") {
      posts.sort((a, b) => hotScore(b) - hotScore(a));
    } else {
      posts.sort((a, b) => b.createdAt - a.createdAt);
    }

    return json(posts);
  }

  if (request.method === "POST") {
    const body = await request.json();
    if (!body.title || !body.content || !body.authorId)
      return json({ error: "Missing fields" }, 400);

    const id = crypto.randomUUID();
    const post = {
      id,
      title: body.title,
      content: body.content,
      image: body.image || null,
      links: body.links || [],
      authorId: body.authorId,
      authorName: body.authorName || "Anonymous",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      upvotes: 0,
      commentsCount: 0
    };

    await kv.put(`post:${id}`, JSON.stringify(post));
    return json(post, 201);
  }

  return json({ error: "Method not allowed" }, 405);
}

function hotScore(post) {
  const score = post.upvotes || 0;
  const ageHours = (Date.now() - post.createdAt) / 3600000;
  return score / Math.pow(ageHours + 2, 1.5);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}