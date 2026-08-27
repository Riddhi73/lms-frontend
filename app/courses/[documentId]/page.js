"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function CoursePage() {
  const { documentId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Fetch course and lessons
  useEffect(() => {
    if (!documentId) return;

    const fetchCourse = async () => {
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

    fetchCourse();
  }, [documentId]);

  // Fetch progress for this student
  useEffect(() => {
    if (!isAuthenticated || !user || lessons.length === 0) return;

    const fetchProgress = async () => {
      try {
        const lessonIds = lessons.map((l) => l.id);
        const response = await axiosInstance.get(
          `/api/progresses?filters[student][id][$eq]=${user.id}&filters[lesson][id][$in]=${lessonIds.join(",")}&filters[completed][$eq]=true`,
        );
        const completed = response.data.data.map((p) => p.lesson.id);
        setCompletedLessons(completed);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
  }, [isAuthenticated, user, lessons]);

  const currentLesson = lessons[currentLessonIndex] || null;
  const isCurrentLessonComplete = currentLesson
    ? completedLessons.includes(currentLesson.id)
    : false;

  const handleMarkComplete = async () => {
    if (!currentLesson || !user) return;

    setMarkingComplete(true);
    try {
      // Check if progress record exists
      const existing = await axiosInstance.get(
        `/api/progresses?filters[student][id][$eq]=${user.id}&filters[lesson][id][$eq]=${currentLesson.id}`,
      );

      if (existing.data.data.length > 0) {
        // Update existing
        const progressId = existing.data.data[0].id;
        await axiosInstance.put(`/api/progresses/${progressId}`, {
          data: {
            completed: true,
            completedAt: new Date().toISOString(),
          },
        });
      } else {
        // Create new
        await axiosInstance.post("/api/progresses", {
          data: {
            student: user.id,
            lesson: currentLesson.id,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        });
      }

      // Update local state
      setCompletedLessons([...completedLessons, currentLesson.id]);
      alert("✅ Lesson marked as complete!");
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("❌ Failed to mark lesson as complete.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const goToNext = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const progressPercentage =
    lessons.length > 0
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

  if (loading) {
    return <div className="p-8 text-center text-xl">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-xl">Course not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to My Courses
        </Link>
        <h1 className="text-2xl font-bold mt-2">{course.Title}</h1>
        <p className="text-gray-600">{course.Description}</p>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-sm text-gray-500">
            Lesson {currentLessonIndex + 1} of {lessons.length}
          </p>
          <div className="flex-1 h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-green-500 rounded transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium">
            {progressPercentage}% complete
          </span>
        </div>
      </div>

      {currentLesson ? (
        <div className="border rounded-lg p-6 shadow">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{currentLesson.Title}</h2>
            {isCurrentLessonComplete && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                ✅ Completed
              </span>
            )}
          </div>

          <div className="prose max-w-none">
            <ReactMarkdown>{currentLesson.Content}</ReactMarkdown>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t">
            <button
              onClick={goToPrevious}
              disabled={currentLessonIndex === 0}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              ← Previous
            </button>

            {isAuthenticated && user?.user_type === "student" && (
              <button
                onClick={handleMarkComplete}
                disabled={markingComplete || isCurrentLessonComplete}
                className={`px-4 py-2 rounded text-white ${
                  isCurrentLessonComplete
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {markingComplete
                  ? "Saving..."
                  : isCurrentLessonComplete
                    ? "✅ Completed"
                    : "Mark Complete"}
              </button>
            )}

            <button
              onClick={goToNext}
              disabled={currentLessonIndex === lessons.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">No lessons available for this course.</p>
      )}
    </div>
  );
}
