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
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraApiUnavailable, setCameraApiUnavailable] = useState(false);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = () => {
    // set scanning flag to render the scanner container first
    if (scannerRef.current) return; // already running
    setScanning(true);
  };

  // Initialize scanner after the scanner container has rendered
  useEffect(() => {
    let mounted = true;
    const ensureScanner = async () => {
      if (!scanning || !containerRef.current || scannerRef.current) return;

      // Check camera permissions first to provide a clear UI message
      try {
        if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Browser or context doesn't support camera API (insecure origin or old browser)
          setCameraApiUnavailable(true);
          setScanning(false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        // Immediately stop the stream - we only wanted to prompt/verify permissions
        stream.getTracks().forEach((t) => t.stop());
        // clear any previous permission errors
        setCameraPermissionDenied(false);
        setCameraApiUnavailable(false);
      } catch (err: any) {
        console.error("Camera permission error:", err);
        // Most browsers throw NotAllowedError / PermissionDeniedError when user denies
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setCameraPermissionDenied(true);
          setScanning(false);
          return;
        }
        setResult({ valid: false, message: "Unable to access camera" });
        setScanning(false);
        return;
      }

      try {
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
              let qrData: any;
              try {
                qrData = JSON.parse(decodedText);
              } catch (e) {
                setResult({ valid: false, message: "Unrecognized QR payload" });
                return;
              }

              const participantId = qrData?.id;
              if (!participantId) {
                setResult({ valid: false, message: "QR does not contain participant id" });
                return;
              }

              const res = await fetch("/api/check-in", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: participantId }),
              });

              if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Check-in failed' }));
                setResult({ valid: false, message: err.message || 'Check-in failed' });
              } else {
                const data = await res.json();
                setResult(data);

                // Reload stats
                const statsRes = await fetch("/api/participants");
                const participants = await statsRes.json();
                setStats({
                  total: participants.length,
                  checkedIn: participants.filter((p: any) => p.checkedInAt).length,
                });
              }
            } catch (err) {
              console.error('QR handler error', err);
              setResult({ valid: false, message: "Invalid QR code format" });
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            console.warn("QR scan error:", error);
          }
        );

        if (mounted) {
          scannerRef.current = scanner;
        } else {
          // If component unmounted while creating scanner, clear it
          try {
            await scanner.clear();
          } catch {}
        }
      } catch (err: any) {
        console.error('Failed to start scanner', err);
        setResult({ valid: false, message: 'Unable to access camera or start scanner' });
        setScanning(false);
      }
    };

    ensureScanner();

    return () => {
      mounted = false;
    };
  }, [scanning]);

  const stopScanning = () => {
    if (scannerRef.current) {
      // clear() returns a promise - await it to ensure camera is released
      scannerRef.current
        .clear()
        .then(() => {
          scannerRef.current = null;
          setScanning(false);
        })
        .catch((err) => {
          console.warn('Failed to clear scanner:', err);
          scannerRef.current = null;
          setScanning(false);
        });
    } else {
      setScanning(false);
    }
  };

  // ensure scanner is cleaned up on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((err) => console.warn('Error clearing scanner on unmount', err));
        scannerRef.current = null;
      }
    };
  }, []);

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

        {cameraPermissionDenied && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800">
            <p className="text-sm">
              Camera access was denied. Please allow camera access for this site in
              your browser settings and retry.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  setCameraPermissionDenied(false);
                  setResult(null);
                  // trigger retry
                  setScanning(true);
                }}
                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
              >
                Retry
              </button>
              <button
                onClick={() => setCameraPermissionDenied(false)}
                className="px-3 py-1 bg-slate-100 text-slate-800 text-sm rounded hover:bg-slate-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {cameraApiUnavailable && (
          <div className="mb-4 p-3 rounded-md bg-yellow-50 border border-amber-200 text-amber-800">
            <p className="text-sm">
              Camera API is not available in this browser or context. The QR scanner
              requires a secure context (HTTPS) or localhost. If you're testing locally,
              run the dev server and open <span className="font-mono">http://localhost:3000</span>.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => {
                  // try to open localhost in a new tab to help user
                  try {
                    window.open("http://localhost:3000", "_blank");
                  } catch {}
                }}
                className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
              >
                Open localhost
              </button>
              <button
                onClick={() => setCameraApiUnavailable(false)}
                className="px-3 py-1 bg-slate-100 text-slate-800 text-sm rounded hover:bg-slate-200"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

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
