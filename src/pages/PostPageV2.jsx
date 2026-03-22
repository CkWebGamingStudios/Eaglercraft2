import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import CommentSectionV2 from "../components/forums/CommentSectionV2";

export default function PostPageV2() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    fetch(`/api/forums_v2/${id}`)
      .then(res => res.json())
      .then(setPost)
      .catch(console.error);
  }, [id]);

  const handleUpvote = async () => {
    await fetch(`/api/forums_v2/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "upvote" })
    });

    setPost(prev => ({ ...prev, upvotes: prev.upvotes + 1 }));
  };

  if (!post) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">{post.title}</h1>

        <div className="text-sm text-zinc-400 mt-2">
          Posted by {post.authorName} • {new Date(post.createdAt).toLocaleString()}
        </div>

        <button
          onClick={handleUpvote}
          className="mt-4 bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500"
        >
          ▲ {post.upvotes}
        </button>

        {post.image && (
          <img
            src={post.image}
            alt="Post"
            className="rounded-xl mt-6 w-full max-h-[500px] object-cover"
          />
        )}

        <div className="prose prose-invert mt-6">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {post.links?.length > 0 && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Links</h3>
            {post.links.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="text-blue-400 block">
                {link}
              </a>
            ))}
          </div>
        )}

        <CommentSectionV2 postId={id} />
      </div>
    </div>
  );
}
