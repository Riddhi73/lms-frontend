"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

export default function Home() {
  const { user, isAuthenticated, userType, logout } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axiosInstance.get(
          "/api/courses?populate=lessons",
        );
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrolling((prev) => ({ ...prev, [courseId]: true }));
    try {
      const payload = {
        data: {
          student: user.id,
          course: courseId,
        },
      };
      console.log("Enrolling in course with ID:", courseId);
      console.log("Sending payload:", JSON.stringify(payload, null, 2));

      const response = await axiosInstance.post("/api/enrollments", payload);

      console.log("Enrollment response:", response.data);
      alert("Successfully enrolled!");
    } catch (error) {
      console.error("Enrollment error:", error);
      const strapiError =
        error.response?.data?.error?.message ||
        error.message ||
        "Enrollment failed";
      alert(`${strapiError}`);
    } finally {
      setEnrolling((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xl">Loading courses...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📚 Available Courses</h1>
        <div>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user?.username} ({user?.user_type})
              </span>
              <Link
                href="/dashboard"
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                My Courses
              </Link>
              {/* 🔥 NEW: Instructor Dashboard link */}
              {["admin", "content_manager", "instructor"].includes(
                userType,
              ) && (
                <Link
                  href="/instructor"
                  className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                >
                  Instructor Dashboard
                </Link>
              )}

              {/* 🔥 NEW: Admin Panel link */}
              {userType === "admin" && (
                <Link
                  href="/admin"
                  className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Login / Signup
            </Link>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <p>No courses found yet.</p>
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => (
            <li key={course.id} className="border p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">{course.Title}</h2>
              <p className="text-gray-600">{course.Description}</p>
              <p className="text-sm text-blue-500 mt-2">
                Lessons: {course.lessons?.length || 0}
              </p>
              {isAuthenticated && userType === "student" && (
                <button
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrolling[course.id]}
                  className="mt-3 bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrolling[course.id] ? "Enrolling..." : "Enroll"}
                </button>
              )}
              {/* 🔥 NEW: Instructor/Admin/CM course management actions */}
              {isAuthenticated &&
                ["admin", "content_manager", "instructor"].includes(
                  userType,
                ) && (
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/instructor/courses/${course.documentId}/edit`}
                      className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      ✏️ Edit
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.documentId}/lessons`}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      📝 Lessons
                    </Link>
                    {/* 🔥 Admin/CM can delete any course */}
                    {["admin", "content_manager"].includes(userType) && (
                      <button className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                        🗑️ Delete
                      </button>
                    )}
                  </div>
                )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
