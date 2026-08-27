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

  // Course & Lesson state
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Progress state
  const [completedLessons, setCompletedLessons] = useState([]);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // ----- Fetch Course & Lessons -----
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

  // ----- Fetch Progress -----
  useEffect(() => {
    if (!isAuthenticated || !user || lessons.length === 0) return;

    const fetchProgress = async () => {
      try {
        const lessonIds = lessons.map((l) => l.id);
        const response = await axiosInstance.get(
          `/api/progresses?filters[student][id][$eq]=${user.id}&filters[lesson][id][$in]=${lessonIds.join(",")}&filters[completed][$eq]=true&populate=lesson`,
        );
        const completed = response.data.data
          .filter((p) => p.lesson) // Only include entries with a lesson
          .map((p) => p.lesson.id);
        setCompletedLessons(completed);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
  }, [isAuthenticated, user, lessons]);

  // ----- Fetch Quiz -----
  useEffect(() => {
    if (!course) return;

    const fetchQuiz = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/quizzes?filters[course][id][$eq]=${course.id}`,
        );
        if (response.data.data.length > 0) {
          setQuiz(response.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      }
    };

    fetchQuiz();
  }, [course]);

  // ----- Fetch Quiz Attempt -----
  useEffect(() => {
    if (!isAuthenticated || !user || !quiz) return;

    const fetchAttempt = async () => {
      try {
        const response = await axiosInstance.get(
          `/api/quiz-attempts?filters[student][id][$eq]=${user.id}&filters[quiz][id][$eq]=${quiz.id}`,
        );
        if (response.data.data.length > 0) {
          setQuizAttempt(response.data.data[0]);
        }
      } catch (error) {
        console.error("Error fetching quiz attempt:", error);
      }
    };

    fetchAttempt();
  }, [isAuthenticated, user, quiz]);

  // ----- Handlers -----
  const currentLesson = lessons[currentLessonIndex] || null;
  const isCurrentLessonComplete = currentLesson
    ? completedLessons.includes(currentLesson.id)
    : false;
  const progressPercentage =
    lessons.length > 0
      ? Math.round((completedLessons.length / lessons.length) * 100)
      : 0;

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

  const handleMarkComplete = async () => {
    if (!currentLesson || !user) return;

    setMarkingComplete(true);
    try {
      // Check if progress record exists
      const existing = await axiosInstance.get(
        `/api/progresses?filters[student][id][$eq]=${user.id}&filters[lesson][id][$eq]=${currentLesson.id}`,
      );

      if (existing.data.data.length > 0) {
        const progressId = existing.data.data[0].id;
        await axiosInstance.put(`/api/progresses/${progressId}`, {
          data: {
            completed: true,
            completedAt: new Date().toISOString(),
          },
        });
      } else {
        await axiosInstance.post("/api/progresses", {
          data: {
            student: user.id,
            lesson: currentLesson.id,
            completed: true,
            completedAt: new Date().toISOString(),
          },
        });
      }

      setCompletedLessons([...completedLessons, currentLesson.id]);
      alert("✅ Lesson marked as complete!");
    } catch (error) {
      console.error("Error marking complete:", error);
      alert("❌ Failed to mark lesson as complete.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleQuizSubmit = async () => {
    if (!quiz || !user) return;

    const questions = quiz.questions;
    let correctCount = 0;

    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / questions.length) * 100);

    setSubmittingQuiz(true);
    try {
      // 🔥 FIX: Use the correct payload format
      const payload = {
        data: {
          student: user.id,
          quiz: quiz.id,
          score: score,
          answers: selectedAnswers,
          submittedAt: new Date().toISOString(),
        },
      };

      // 🔥 If that fails, try with the Content Manager API format
      // const payload = {
      //   student: {
      //     connect: [{ id: user.id }]
      //   },
      //   quiz: {
      //     connect: [{ id: quiz.id }]
      //   },
      //   score: score,
      //   answers: selectedAnswers,
      //   submittedAt: new Date().toISOString(),
      // };

      console.log(
        "📤 Submitting quiz payload:",
        JSON.stringify(payload, null, 2),
      );

      const response = await axiosInstance.post("/api/quiz-attempts", payload);

      setQuizAttempt(response.data.data);
      alert(
        `🎯 You scored ${score}% (${correctCount}/${questions.length} correct)!`,
      );
      setShowQuiz(false);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      console.error("📦 Error response:", error.response?.data);
      alert(
        `❌ Failed to submit quiz: ${error.response?.data?.error?.message || error.message}`,
      );
    } finally {
      setSubmittingQuiz(false);
    }
  };

  // ----- Loading / Not Found -----
  if (loading) {
    return <div className="p-8 text-center text-xl">Loading course...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-xl">Course not found</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Lesson Content */}
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

      {/* Quiz Section */}
      {quiz && isAuthenticated && user?.user_type === "student" && (
        <div className="mt-8 border-t pt-6">
          <button
            onClick={() => setShowQuiz(!showQuiz)}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            {showQuiz
              ? "Hide Quiz"
              : quizAttempt
                ? "View Quiz Results"
                : "📝 Take Quiz"}
          </button>

          {showQuiz && quizAttempt && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold">Quiz Results</h3>
              <p className="text-2xl font-bold text-green-600">
                {quizAttempt.score}%
              </p>
              <p className="text-gray-600">
                You answered {Object.keys(quizAttempt.answers).length} questions
              </p>
              <button
                onClick={() => setShowQuiz(false)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Close
              </button>
            </div>
          )}

          {showQuiz && !quizAttempt && (
            <div className="mt-4 p-4 bg-white border rounded-lg">
              <h3 className="text-lg font-semibold mb-4">{quiz.title}</h3>
              {quiz.questions.map((q, qIndex) => (
                <div key={qIndex} className="mb-6">
                  <p className="font-medium mb-2">
                    {qIndex + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          value={oIndex}
                          checked={selectedAnswers[qIndex] === oIndex}
                          onChange={() => handleAnswerSelect(qIndex, oIndex)}
                          className="w-4 h-4"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleQuizSubmit}
                disabled={
                  submittingQuiz ||
                  Object.keys(selectedAnswers).length < quiz.questions.length
                }
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {submittingQuiz ? "Submitting..." : "Submit Quiz"}
              </button>
              {Object.keys(selectedAnswers).length < quiz.questions.length && (
                <p className="text-sm text-red-500 mt-2">
                  Please answer all questions before submitting.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
