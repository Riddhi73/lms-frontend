"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function BlogManager() {
  const { user, isAuthenticated, userType } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    body: "",
    coverImageUrl: "",
    status: "draft",
  });
  const [loading, setLoading] = useState(true);

  // 🔥 Cleanup flag to prevent state updates on unmount
  const isMounted = useRef(true);

  // Redirect and fetch posts
  useEffect(() => {
    // Redirect if not allowed
    if (isAuthenticated && !["admin", "content_manager"].includes(userType)) {
      router.push("/");
      return;
    }
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // 🔥 Fetch posts inside the effect
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/blog-posts?populate=author&sort=createdAt:desc",
        );
        if (isMounted.current) {
          setPosts(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    // Cleanup
    return () => {
      isMounted.current = false;
    };
  }, [isAuthenticated, userType]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        data: {
          ...form,
          author: user.id,
        },
      };
      if (editing) {
        await axiosInstance.put(`/api/blog-posts/${editing}`, payload);
      } else {
        await axiosInstance.post("/api/blog-posts", payload);
      }
      alert("✅ Post saved!");
      setForm({ title: "", body: "", coverImageUrl: "", status: "draft" });
      setEditing(null);
      // Refetch posts after save
      const response = await axiosInstance.get(
        "/api/blog-posts?populate=author&sort=createdAt:desc",
      );
      setPosts(response.data.data);
    } catch (error) {
      console.error("Error saving post:", error);
      alert("❌ Failed to save post.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await axiosInstance.delete(`/api/blog-posts/${id}`);
      alert("✅ Post deleted.");
      const response = await axiosInstance.get(
        "/api/blog-posts?populate=author&sort=createdAt:desc",
      );
      setPosts(response.data.data);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("❌ Failed to delete post.");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Blog Manager</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow mb-8"
      >
        <h2 className="text-xl font-semibold mb-4">
          {editing ? "Edit Post" : "Create New Post"}
        </h2>
        <div className="mb-4">
          <label className="block font-medium">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Body (Markdown)</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full border rounded px-3 py-2 h-40"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Cover Image URL</label>
          <input
            type="text"
            value={form.coverImageUrl}
            onChange={(e) =>
              setForm({ ...form, coverImageUrl: e.target.value })
            }
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="mb-4">
          <label className="block font-medium">Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editing ? "Update" : "Create"} Post
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm({
                title: "",
                body: "",
                coverImageUrl: "",
                status: "draft",
              });
            }}
            className="ml-2 bg-gray-300 px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </form>

      <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold">{post.title}</h3>
              <p className="text-sm text-gray-500">
                Status:{" "}
                <span
                  className={`px-2 py-1 text-xs rounded ${post.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {post.status}
                </span>
              </p>
            </div>
            <div>
              <button
                onClick={() => {
                  setEditing(post.id);
                  setForm({
                    title: post.title,
                    body: post.body,
                    coverImageUrl: post.coverImageUrl || "",
                    status: post.status,
                  });
                }}
                className="text-blue-600 hover:underline mr-4"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(post.id)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
