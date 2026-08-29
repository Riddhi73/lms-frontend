"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Error:", error);
  }, [error]);

  if (error?.response?.status === 403) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">403 - Access Denied</h1>
        <p className="mt-2">
          You don&apos;t have permission to perform this action.
        </p>
        <button
          onClick={() => (window.location.href = "/dashboard")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
      <p className="mt-2">{error?.message || "Please try again."}</p>
      <button
        onClick={reset}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Try again
      </button>
    </div>
  );
}
