"use client";

import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScanResult {
  valid: boolean;
  status?: string;
  message: string;
  participant?: {
    id: string;
    fullName: string;
    email: string;
    designation: string;
    institution: string;
    checkedInAt?: string;
  };
}

export default function QRScanner() {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = () => {
    if (!containerRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        aspectRatio: 1.0,
        disableFlip: false,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        try {
          setLoading(true);
          const qrData = JSON.parse(decodedText);
          const participantId = qrData.id;

          const res = await fetch("/api/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: participantId }),
          });

          const data = await res.json();
          setResult(data);

          // Reload stats
          const statsRes = await fetch("/api/participants");
          const participants = await statsRes.json();
          setStats({
            total: participants.length,
            checkedIn: participants.filter(
              (p: any) => p.checkedInAt
            ).length,
          });
        } catch (err) {
          setResult({
            valid: false,
            message: "Invalid QR code format",
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.warn("QR scan error:", error);
      }
    );

    scannerRef.current = scanner;
    setScanning(true);
  };

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch("/api/participants");
        const participants = await res.json();
        setStats({
          total: participants.length,
          checkedIn: participants.filter((p: any) => p.checkedInAt).length,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow">
          <p className="text-sm text-slate-500">Total Registrations</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <p className="text-sm text-slate-500">Checked In</p>
          <p className="text-3xl font-bold text-teal-600">{stats.checkedIn}</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <p className="text-sm text-slate-500">Pending Entry</p>
          <p className="text-3xl font-bold text-amber-600">
            {stats.total - stats.checkedIn}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {scanning ? "QR Code Scanner Active" : "Entry Verification"}
        </h2>

        {!scanning ? (
          <button
            onClick={startScanning}
            className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 font-medium"
          >
            Start Scanning QR Code
          </button>
        ) : (
          <>
            <div
              id="qr-reader"
              ref={containerRef}
              style={{ width: "100%" }}
            ></div>
            <button
              onClick={stopScanning}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 font-medium mt-4"
            >
              Stop Scanning
            </button>
          </>
        )}

        {loading && (
          <div className="mt-4 text-center text-slate-600">
            Processing QR code...
          </div>
        )}

        {result && (
          <div
            className={`mt-4 p-4 rounded-lg border ${
              result.valid
                ? result.status === "already_checked_in"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            {result.valid ? (
              <>
                <h3
                  className={`font-semibold text-lg ${
                    result.status === "already_checked_in"
                      ? "text-blue-800"
                      : "text-green-800"
                  }`}
                >
                  {result.status === "already_checked_in"
                    ? "Already Checked In"
                    : "Check-In Successful"}
                </h3>
                <p
                  className={`mt-1 ${
                    result.status === "already_checked_in"
                      ? "text-blue-700"
                      : "text-green-700"
                  }`}
                >
                  {result.message}
                </p>
                {result.participant && (
                  <div className="mt-4 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {result.participant.fullName}
                    </p>
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {result.participant.email}
                    </p>
                    <p>
                      <span className="font-medium">Designation:</span>{" "}
                      {result.participant.designation}
                    </p>
                    <p>
                      <span className="font-medium">Institution:</span>{" "}
                      {result.participant.institution}
                    </p>
                    {result.participant.checkedInAt && (
                      <p>
                        <span className="font-medium">Checked In At:</span>{" "}
                        {new Date(
                          result.participant.checkedInAt
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="font-semibold text-lg text-red-800">
                  Entry Failed
                </h3>
                <p className="mt-1 text-red-700">{result.message}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
