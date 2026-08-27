"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axios";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import Image from "next/image";

export default function BlogPostPage() {
  const { documentId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!documentId) return;
    const fetchPost = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/blog-posts/${documentId}?populate=author`,
        );
        setPost(response.data.data);
      } catch (error) {
        console.error("Error fetching blog post:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [documentId]);

  if (loading) {
    return <div className="p-8 text-center text-xl">Loading post...</div>;
  }

  if (!post) {
    return <div className="p-8 text-center text-xl">Post not found</div>;
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/blog" className="text-blue-600 hover:underline">
        ← Back to Blog
      </Link>
      <h1 className="text-3xl font-bold mt-4">{post.title}</h1>
      <p className="text-sm text-gray-500">
        By {post.author?.username || "Unknown"} on{" "}
        {new Date(post.createdAt).toLocaleDateString()}
      </p>
      {post.coverImageUrl && (
        <Image
          src={post.coverImageUrl}
          alt={post.title}
          className="w-full h-64 object-cover rounded my-4"
        />
      )}
      <div className="prose max-w-none mt-4">
        <ReactMarkdown>{post.body}</ReactMarkdown>
      </div>
    </div>
  );
}
