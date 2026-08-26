"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

export default function Dashboard() {
  const { user, isAuthenticated, logout } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchEnrollments = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/enrollments?filters[student][id][$eq]=${user.id}&populate[course][populate]=lessons`,
        );
        setEnrollments(response.data.data);
      } catch (error) {
        console.error("Error fetching enrollments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrollments();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        Please{" "}
        <Link href="/auth/login" className="text-blue-600">
          login
        </Link>{" "}
        to view your courses.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-xl">Loading your courses...</div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🎓 My Courses</h1>
        <div className="flex gap-4 items-center">
          <span className="text-sm text-gray-600">👋 {user?.username}</span>
          <Link
            href="/"
            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            Browse All
          </Link>
          <button
            onClick={logout}
            className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">
            You haven&apos;t enrolled in any courses yet.
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Browse available courses →
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            return (
              <li key={enrollment.id} className="border p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold">{course?.Title}</h2>
                <p className="text-gray-600">{course?.Description}</p>
                <p className="text-sm text-blue-500 mt-2">
                  Lessons: {course?.lessons?.length || 0}
                </p>
                <Link
                  href={`/courses/${course?.documentId}`}
                  className="mt-3 inline-block bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
                >
                  Start Learning
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
