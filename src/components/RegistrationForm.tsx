"use client";

import { useState } from "react";
import type { ParticipantType, Gender } from "@/types/registration";
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
      prefill?: { name?: string; email?: string; contact?: string };
      handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    }) => { open: () => void };
  }
}

interface FormData {
  prefix?: string;
  fullName: string;
  email: string;
  phone: string;
  gender: Gender;
  designation: ParticipantType;
  institution: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paperSubmission: boolean;
  photoBase64?: string;
}

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_PHOTO_DIM = 400;
const PHOTO_JPEG_QUALITY = 0.8;

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_PHOTO_SIZE) {
      reject(new Error("Photo must be under 2MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > MAX_PHOTO_DIM || height > MAX_PHOTO_DIM) {
          if (width > height) {
            height = (height / width) * MAX_PHOTO_DIM;
            width = MAX_PHOTO_DIM;
          } else {
            width = (width / height) * MAX_PHOTO_DIM;
            height = MAX_PHOTO_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Invalid image file"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    prefix: "",
    fullName: "",
    email: "",
    phone: "",
    gender: "male",
    designation: "student",
    institution: "",
    address: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "",
    },
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
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
      if (!razorpayKey) {
        throw new Error(
          "NEXT_PUBLIC_RAZORPAY_KEY_ID is not set. Add it to .env.local (same value as RAZORPAY_KEY_ID) and restart the dev server."
        );
      }
      await loadRazorpay();

      new window.Razorpay({
        key: razorpayKey,
        amount: amount * 100,
        currency: "INR",
        order_id: orderId,
        name: "Mata Sushila Institute of Education",
        description: "National Seminar on Education & Mental Health - Registration",
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone.startsWith("+") ? formData.phone : `+91${formData.phone}`,
        },
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

          let result: { success?: boolean; participantId?: string; error?: string };
          try {
            result = await verifyRes.json();
          } catch {
            setError("Server error. Please try again or contact support.");
            return;
          }
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
          Prefix & Full Name *
        </label>
        <div className="flex gap-3">
          <select
            required
            value={formData.prefix}
            onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
            className="w-28 rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          >
            <option value="" disabled>
              Select
            </option>
            <option value="Mr.">Mr.</option>
            <option value="Mrs.">Mrs.</option>
            <option value="Ms.">Ms.</option>
          </select>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            className="flex-1 rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            placeholder="Enter your full name"
          />
        </div>
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="10-digit mobile number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Gender *
        </label>
        <select
          required
          value={formData.gender}
          onChange={(e) =>
            setFormData({ ...formData, gender: e.target.value as Gender })
          }
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        >
          <option value="student">Student (₹250 + ₹500 for paper)</option>
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          placeholder="Your institution name"
        />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Full Address *</h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            required
            value={formData.address.street}
            onChange={(e) =>
              setFormData({
                ...formData,
                address: { ...formData.address, street: e.target.value },
              })
            }
            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
            placeholder="House number, street name"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              City *
            </label>
            <input
              type="text"
              required
              value={formData.address.city}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              State/Province *
            </label>
            <input
              type="text"
              required
              value={formData.address.state}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="State/Province"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Postal Code *
            </label>
            <input
              type="text"
              required
              value={formData.address.postalCode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, postalCode: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="Postal code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Country *
            </label>
            <input
              type="text"
              required
              value={formData.address.country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  address: { ...formData.address, country: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Photo (optional)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) {
              setFormData((prev) => ({ ...prev, photoBase64: undefined }));
              return;
            }
            try {
              const base64 = await resizeImageToBase64(file);
              setFormData((prev) => ({ ...prev, photoBase64: base64 }));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Invalid photo");
              setFormData((prev) => ({ ...prev, photoBase64: undefined }));
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-2.5 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        />
        {formData.photoBase64 && (
          <p className="text-xs text-teal-600 mt-1">✓ Photo uploaded (max 2MB, resized if needed)</p>
        )}
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
