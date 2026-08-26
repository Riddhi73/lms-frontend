"use client";

import { useEffect, useState } from "react";
import axios from "axios";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/courses?populate=lessons`,
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

  if (loading) {
    return <div className="p-8 text-center text-xl">Loading courses...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📚 Available Courses</h1>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
