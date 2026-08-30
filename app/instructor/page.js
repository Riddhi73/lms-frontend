"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function InstructorDashboard() {
  const { user, isAuthenticated, userType } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!["admin", "content_manager", "instructor"].includes(userType)) {
      router.push("/");
      return;
    }

    const fetchCourses = async () => {
      try {
        // 🔥 Fetch courses created by this instructor
        const response = await axiosInstance.get(
          `/api/courses?filters[createdBy][id][$eq]=${user.id}&populate=lessons`,
        );
        setCourses(response.data.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, userType, user, router]);

  if (loading) {
    return <div className="p-8 text-center text-xl">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Instructor Dashboard</h1>

      <Link
        href="/instructor/courses/create"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block mb-6"
      >
        + Create New Course
      </Link>

      {courses.length === 0 ? (
        <p className="text-gray-600">
          You haven&apos;t created any courses yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {courses.map((course) => (
            <li key={course.id} className="border p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold">{course.Title}</h2>
              <p className="text-gray-600">{course.Description}</p>
              <p className="text-sm text-blue-500 mt-2">
                Lessons: {course.lessons?.length || 0}
              </p>
              <div className="mt-3 space-x-2">
                <Link
                  href={`/instructor/courses/${course.documentId}/edit`}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit
                </Link>
                <Link
                  href={`/instructor/courses/${course.documentId}/lessons`}
                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Manage Lessons
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
