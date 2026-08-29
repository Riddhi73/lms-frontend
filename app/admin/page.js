"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user, isAuthenticated, userType } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    if (isAuthenticated && userType !== "admin") {
      router.push("/");
    }
    if (!isAuthenticated) {
      router.push("/auth/login");
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("jwt");

        // 🔥 Fetch users
        const usersRes = await axiosInstance.get("/api/users?populate=role", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersData = usersRes.data;
        setUsers(usersData);

        // 🔥 Fetch courses (using document ID)
        const coursesRes = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/courses?pagination[pageSize]=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const coursesData = await coursesRes.json();

        // 🔥 Fetch enrollments
        const enrollmentsRes = await fetch(
          `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/enrollments?pagination[pageSize]=100`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        const enrollmentsData = await enrollmentsRes.json();

        // 🔥 Calculate stats
        const totalUsers = usersData.length || 0;
        const totalCourses = coursesData.data?.length || 0;
        const totalEnrollments = enrollmentsData.data?.length || 0;
        const students =
          usersData.filter((u) => u.user_type === "student").length || 0;

        setStats({
          totalUsers,
          totalCourses,
          totalEnrollments,
          students,
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        // 🔥 Set default stats if API fails
        setStats({
          totalUsers: 0,
          totalCourses: 0,
          totalEnrollments: 0,
          students: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, userType, router]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    try {
      const token = localStorage.getItem("jwt");
      await axiosInstance.put(
        `/api/users/${userId}`,
        { user_type: newRole },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, user_type: newRole } : u)),
      );
      alert("✅ Role updated successfully!");
    } catch (error) {
      console.error("Error updating role:", error);
      alert("❌ Failed to update role.");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xl">Loading admin panel...</div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Courses</p>
          <p className="text-2xl font-bold">{stats.totalCourses}</p>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total Enrollments</p>
          <p className="text-2xl font-bold">{stats.totalEnrollments}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Students</p>
          <p className="text-2xl font-bold">{stats.students}</p>
        </div>
      </div>

      {/* User Management */}
      <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Current Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Change Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{u.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs rounded bg-gray-100">
                    {u.user_type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={u.user_type}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={updating === u.id}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="admin">Admin</option>
                    <option value="content_manager">Content Manager</option>
                    <option value="instructor">Instructor</option>
                    <option value="student">Student</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
