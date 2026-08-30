"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

export default function CreateCoursePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    Title: "",
    Description: "",
  });
  const [error, setError] = useState("");

  // Redirect if not logged in or not authorized
  if (
    !isAuthenticated ||
    !["admin", "content_manager", "instructor"].includes(user?.user_type)
  ) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        data: {
          Title: form.Title,
          Description: form.Description,
          instructor: {
            connect: [{ id: user.id }],
          },
        },
      };

      console.log("📤 Creating course:", payload);

      const response = await axiosInstance.post("/api/course", payload);

      console.log("✅ Course created:", response.data);
      alert("✅ Course created successfully!");
      router.push("/instructor");
    } catch (error) {
      console.error("❌ Error creating course:", error);
      setError(
        error.response?.data?.error?.message || "Failed to create course",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/instructor" className="text-blue-600 hover:underline">
        ← Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold mt-4 mb-6">Create New Course</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow">
        <div className="mb-4">
          <label className="block font-medium mb-1">Course Title *</label>
          <input
            type="text"
            value={form.Title}
            onChange={(e) => setForm({ ...form, Title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Description</label>
          <textarea
            value={form.Description}
            onChange={(e) => setForm({ ...form, Description: e.target.value })}
            className="w-full border rounded px-3 py-2 h-32"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Course"}
        </button>
      </form>
    </div>
  );
}
