"use client";

import { useState } from "react";
import type { ParticipantType } from "@/types/registration";
import { FEE_STRUCTURE } from "@/types/registration";

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description: string;
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    }) => { open: () => void };
  }
}

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  designation: ParticipantType;
  institution: string;
  paperSubmission: boolean;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phone: "",
    designation: "student",
    institution: "",
    paperSubmission: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fees = FEE_STRUCTURE[formData.designation];
  const totalAmount = formData.paperSubmission ? fees.base + fees.paper : fees.base;

  const loadRazorpay = () => {
    return new Promise<void>((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const orderRes = await fetch("/api/order/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation: formData.designation,
          paperSubmission: formData.paperSubmission,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.error || "Failed to create order");
      }

      const { orderId, amount } = await orderRes.json();
      await loadRazorpay();

      new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: amount * 100,
        currency: "INR",
        order_id: orderId,
        name: "Mata Sushila Institute of Education",
        description: "National Seminar on Education & Mental Health - Registration",
        handler: async (response) => {
          const verifyRes = await fetch("/api/order/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              formData,
            }),
          });

          const result = await verifyRes.json();
          if (result.success) {
            window.location.href = `/success?id=${result.participantId}`;
          } else {
            setError(result.error || "Payment verification failed");
          }
        },
      }).open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="Enter your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Phone *
        </label>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="10-digit mobile number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Designation *
        </label>
        <select
          required
          value={formData.designation}
          onChange={(e) =>
            setFormData({
              ...formData,
              designation: e.target.value as ParticipantType,
            })
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition bg-white"
        >
          <option value="student">Student (₹250 + ₹1000 for paper)</option>
          <option value="faculty">Faculty (₹350 + ₹1000 for paper)</option>
          <option value="professional">Professional/Ph.D (₹400 + ₹1000 for paper)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Institution / Organization *
        </label>
        <input
          type="text"
          required
          value={formData.institution}
          onChange={(e) =>
            setFormData({ ...formData, institution: e.target.value })
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="Your institution name"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="paper"
          checked={formData.paperSubmission}
          onChange={(e) =>
            setFormData({ ...formData, paperSubmission: e.target.checked })
          }
          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
        />
        <label htmlFor="paper" className="text-sm text-slate-700">
          I wish to submit a paper (+₹1000)
        </label>
      </div>

      <div className="rounded-xl bg-slate-50 p-4 border border-slate-200">
        <p className="text-sm font-medium text-slate-700">Registration Fee</p>
        <p className="text-2xl font-bold text-teal-600 mt-1">
          ₹{totalAmount}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Includes: Certificate, Kit, and Refreshments
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition"
      >
        {loading ? "Processing..." : `Pay ₹${totalAmount} & Register`}
      </button>
    </form>
  );
}
