"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [participant, setParticipant] = useState<{
    fullName: string;
    email: string;
    amount: number;
    qrCode: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch("/api/participants")
      .then((res) => res.json())
      .then((participants: { id: string; fullName: string; email: string; amount: number; qrCode: string }[]) => {
        const p = participants.find((x) => x.id === id);
        setParticipant(p || null);
      })
      .catch(() => setParticipant(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800">
            Registration not found
          </h1>
          <a
            href="/"
            className="mt-4 inline-block text-teal-600 hover:underline"
          >
            Back to Registration
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-slate-100 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-teal-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Registration Successful!
          </h1>
          <p className="text-slate-600 mt-2">
            Thank you, {participant.fullName}. Your payment of ₹{participant.amount} has been received.
          </p>

          <div className="mt-8 p-6 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-700 mb-3">
              Your Event Pass (QR Code)
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Show this QR code at the venue for verification
            </p>
            <div className="inline-block p-4 bg-white rounded-lg">
              <img
                src={participant.qrCode}
                alt="Registration QR Code"
                className="w-48 h-48"
              />
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Save or screenshot this page for easy access
            </p>
          </div>

          <div className="mt-8 text-left bg-teal-50 rounded-lg p-4 text-sm text-slate-700">
            <p className="font-medium text-teal-800">Event Details</p>
            <p className="mt-1">22 & 23 March 2026</p>
            <p>Saiyad bahri, Hilsa-Chandi Road, Hilsa, Nalanda</p>
          </div>

          <a
            href="/"
            className="mt-6 inline-block text-teal-600 hover:underline text-sm"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
