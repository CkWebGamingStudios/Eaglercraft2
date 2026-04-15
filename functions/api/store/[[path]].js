function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function getStoreKv(env) {
  return env.ELGE_STORE || env.ELGE_FORUMS;
}

async function listAll(kv, prefix) {
  if (!kv?.list) return [];
  const out = [];
  let cursor;
  do {
    const res = await kv.list({ prefix, cursor });
    out.push(...(res?.keys || []));
    cursor = res?.list_complete ? undefined : res?.cursor;
  } while (cursor);
  return out;
}

async function commitToRepo(env, game) {
  if (!env.GAMES_REPO_PAT) {
    return { committed: false, warning: "Stored in ELGE_STORE only. Set GAMES_REPO_PAT to enable GitHub commits." };
  }

  const owner = "CkWebGamingStudios";
  const repo = "Eaglercraft2Games";
  const branch = env.GAMES_REPO_BRANCH || "main";
  const path = `games/${game.id}.json`;
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(game, null, 2))));

  const req = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${env.GAMES_REPO_PAT}`,
      Accept: "application/vnd.github+json",
      "User-Agent': 'Eaglercraft2/1.0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: `Publish game: ${game.name} (${game.id})`,
      content,
      branch
    })
  });

  if (!req.ok) {
    const body = await req.text();
    return { committed: false, warning: `GitHub commit failed: ${body.slice(0, 180)}` };
  }

  return { committed: true };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const kv = getStoreKv(env);
  if (!kv) return json({ error: "ELGE_STORE KV binding is missing" }, 500);

  const rawPath = params?.path;
  const tail = Array.isArray(rawPath)
    ? rawPath.filter(Boolean)
    : (typeof rawPath === "string" ? rawPath.split("/").filter(Boolean) : []);
  const action = tail[0] || "";

  if (request.method === "GET" && !action) {
    const keys = await listAll(kv, "store:game:");
    const games = [];
    for (const key of keys) {
      const raw = await kv.get(key.name);
      if (!raw) continue;
      try {
        games.push(JSON.parse(raw));
      } catch {
        // ignore invalid rows
      }
    }
    games.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
    return json({ success: true, result: games });
  }

  if (request.method === "POST" && action === "publish") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const game = {
      id: crypto.randomUUID(),
      name: String(body?.name || "Untitled game").slice(0, 120),
      description: String(body?.description || "").slice(0, 1000),
      files: typeof body?.files === "object" && body?.files ? body.files : {},
      script: String(body?.script || ""),
      createdAt: Date.now(),
      author: "editor-user"
    };

    await kv.put(`store:game:${game.id}`, JSON.stringify(game));
    const repo = await commitToRepo(env, game);

    return json({
      success: true,
      game,
      repoCommitted: repo.committed,
      warning: repo.warning || ""
    });
  }

  return json({ error: "Store route not found" }, 404);
}
