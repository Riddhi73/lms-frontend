"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

export default function ManageLessonsPage() {
  const { documentId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [form, setForm] = useState({ Title: "", Content: "", Order: 1 });
  const [saving, setSaving] = useState(false);

  // ✅ Hooks before any conditional returns
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

    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/courses/${documentId}?populate[lessons][sort]=Order:asc`,
        );
        const courseData = response.data.data;
        setCourse(courseData);
        setLessons(courseData.lessons || []);
      } catch (error) {
        console.error("Error fetching course:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [documentId, isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        data: {
          Title: form.Title,
          Content: form.Content,
          Order: parseInt(form.Order) || lessons.length + 1,
          course: course.id,
        },
      };

      if (editingLesson) {
        await axiosInstance.put(`/api/lessons/${editingLesson}`, payload);
      } else {
        await axiosInstance.post("/api/lessons", payload);
      }

      alert(editingLesson ? "✅ Lesson updated!" : "✅ Lesson created!");
      setForm({ Title: "", Content: "", Order: 1 });
      setShowForm(false);
      setEditingLesson(null);

      // Refresh
      const response = await axiosInstance.get(
        `/api/courses/${documentId}?populate[lessons][sort]=Order:asc`,
      );
      setLessons(response.data.data.lessons || []);
    } catch (error) {
      alert("❌ Failed to save lesson.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await axiosInstance.delete(`/api/lessons/${lessonId}`);
      const response = await axiosInstance.get(
        `/api/courses/${documentId}?populate[lessons][sort]=Order:asc`,
      );
      setLessons(response.data.data.lessons || []);
    } catch (error) {
      alert("❌ Failed to delete lesson.");
    }
  };

  if (
    !isAuthenticated ||
    !["admin", "content_manager", "instructor"].includes(user?.user_type)
  ) {
    return null;
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/instructor" className="text-blue-600 hover:underline">
        ← Back to Dashboard
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-2">{course?.Title}</h1>
      <p className="text-gray-600 mb-6">Manage Lessons</p>

      <button
        onClick={() => {
          setShowForm(!showForm);
          setEditingLesson(null);
          setForm({ Title: "", Content: "", Order: 1 });
        }}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-6"
      >
        {showForm ? "Cancel" : "+ Add Lesson"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow mb-6"
        >
          <h2 className="text-xl font-semibold mb-4">
            {editingLesson ? "Edit Lesson" : "New Lesson"}
          </h2>
          <div className="mb-4">
            <label className="block font-medium">Title</label>
            <input
              type="text"
              value={form.Title}
              onChange={(e) => setForm({ ...form, Title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium">Content (Markdown)</label>
            <textarea
              value={form.Content}
              onChange={(e) => setForm({ ...form, Content: e.target.value })}
              className="w-full border rounded px-3 py-2 h-32"
            />
          </div>
          <div className="mb-4">
            <label className="block font-medium">Order</label>
            <input
              type="number"
              value={form.Order}
              onChange={(e) =>
                setForm({ ...form, Order: parseInt(e.target.value) || 1 })
              }
              className="w-full border rounded px-3 py-2"
              min="1"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingLesson ? "Update" : "Create"}
          </button>
        </form>
      )}

      <h2 className="text-2xl font-bold mb-4">Lessons</h2>
      {lessons.length === 0 ? (
        <p className="text-gray-500">No lessons yet.</p>
      ) : (
        <ul className="space-y-3">
          {lessons.map((lesson) => (
            <li
              key={lesson.id}
              className="border p-4 rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <span className="text-sm text-gray-500 mr-2">
                  #{lesson.Order}
                </span>
                <span className="font-semibold">{lesson.Title}</span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    setEditingLesson(lesson.id);
                    setForm({
                      Title: lesson.Title || "",
                      Content: lesson.Content || "",
                      Order: lesson.Order || 1,
                    });
                    setShowForm(true);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(lesson.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
