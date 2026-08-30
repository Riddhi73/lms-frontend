"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

export default function EditCoursePage() {
  const { documentId } = useParams(); // e.g., "nk8a2cu26gg4wppqunx47o99"
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ Title: "", Description: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      !isAuthenticated ||
      !["admin", "content_manager", "instructor"].includes(user?.user_type)
    ) {
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!documentId) return;
    if (
      !isAuthenticated ||
      !["admin", "content_manager", "instructor"].includes(user?.user_type)
    ) {
      return;
    }

    const fetchCourse = async () => {
      try {
        console.log("🔍 Fetching course with documentId:", documentId);
        // 🔥 Use documentId directly in the URL
        const response = await axiosInstance.get(`/api/courses/${documentId}`);
        console.log("✅ Course response:", response.data);

        // Strapi v5 REST API returns data inside 'data' key
        const course = response.data.data;
        if (!course) {
          setError("Course not found");
          return;
        }

        setForm({
          Title: course.Title || "",
          Description: course.Description || "",
        });
      } catch (error) {
        console.error("❌ Error fetching course:", error);
        setError("Course not found");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [documentId, isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // 🔥 Use documentId directly in the URL
      const payload = {
        data: {
          Title: form.Title,
          Description: form.Description,
        },
      };

      console.log("📤 Updating course with documentId:", documentId);
      await axiosInstance.put(`/api/courses/${documentId}`, payload);

      alert("✅ Course updated successfully!");
      router.push("/instructor");
    } catch (error) {
      console.error("❌ Error updating course:", error);
      setError(
        error.response?.data?.error?.message || "Failed to update course",
      );
    } finally {
      setSaving(false);
    }
  };

  if (
    !isAuthenticated ||
    !["admin", "content_manager", "instructor"].includes(user?.user_type)
  ) {
    return null;
  }

  if (loading) return <div className="p-8 text-center">Loading course...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <Link href="/instructor" className="text-blue-600 hover:underline">
        ← Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Edit Course</h1>
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
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Update Course"}
        </button>
      </form>
    </div>
  );
}
