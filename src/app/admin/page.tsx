"use client";

import { useEffect, useState } from "react";
import type { Participant } from "@/types/registration";

export default function AdminPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "seminar2026";

  useEffect(() => {
    if (authenticated) {
      fetch("/api/participants")
        .then((res) => res.json())
        .then(setParticipants)
        .catch(() => setParticipants([]))
        .finally(() => setLoading(false));
    }
  }, [authenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert("Invalid password");
    }
  };

  const totalRevenue = participants.reduce((sum, p) => sum + p.amount, 0);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full"
        >
          <h1 className="text-xl font-semibold text-slate-800 mb-4">
            Admin Access
          </h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2 mb-4"
          />
          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Seminar Registrations
          </h1>
          <div className="flex gap-3">
            <a
              href="/api/participants/export"
              download
              className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export to CSV
            </a>
            <a
              href="/"
              className="inline-flex items-center gap-2 border border-slate-300 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-800 text-sm"
            >
              ← Back
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-slate-500">Total Registrations</p>
            <p className="text-2xl font-bold text-slate-800">
              {participants.length}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-teal-600">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow">
            <p className="text-sm text-slate-500">Paper Submissions</p>
            <p className="text-2xl font-bold text-slate-800">
              {participants.filter((p) => p.paperSubmission).length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading...</div>
          ) : participants.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No registrations yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Name
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Email
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Phone
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Gender
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Designation
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Institution
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Paper
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Amount
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Payment ID
                    </th>
                    <th className="text-left p-4 font-medium text-slate-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50"
                    >
                      <td className="p-4 text-slate-800">{p.fullName}</td>
                      <td className="p-4 text-slate-800">{p.email}</td>
                      <td className="p-4 text-slate-800">{p.phone}</td>
                      <td className="p-4 text-slate-800 capitalize">{p.gender || "-"}</td>
                      <td className="p-4 text-slate-800 capitalize">{p.designation}</td>
                      <td className="p-4 text-slate-800">{p.institution}</td>
                      <td className="p-4 text-slate-800">{p.paperSubmission ? "Yes" : "No"}</td>
                      <td className="p-4 text-slate-800">₹{p.amount}</td>
                      <td className="p-4 text-slate-800 font-mono text-xs">
                        {p.paymentId?.slice(0, 12)}...
                      </td>
                      <td className="p-4 text-slate-600">
                        {new Date(p.paidAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
