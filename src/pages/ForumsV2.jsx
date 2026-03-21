import { useEffect, useState } from "react";
import PostCardV2 from "../components/forums/PostCardV2";

export default function ForumsV2() {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("new");

  useEffect(() => {
    fetch(`/api/forums_v2?sort=${sort}`)
      .then(res => res.json())
      .then(setPosts)
      .catch(console.error);
  }, [sort]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Forums</h1>
          <div className="flex gap-3">
            {["new", "top", "hot"].map(type => (
              <button
                key={type}
                onClick={() => setSort(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  sort === type
                    ? "bg-blue-600"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {posts.map(post => (
            <PostCardV2 key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
