import { NextResponse } from "next/server";
import { getAllParticipants } from "@/lib/participants";

function escapeCSV(value: string | number | boolean): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const participants = await getAllParticipants();
    const headers = [
      "ID",
      "Full Name",
      "Email",
      "Phone",
      "Gender",
      "Photo",
      "Designation",
      "Institution",
      "Street Address",
      "City",
      "State/Province",
      "Postal Code",
      "Country",
      "Paper Submission",
      "Amount (₹)",
      "Payment ID",
      "Order ID",
      "Paid At",
      "Created At",
    ];

    const rows = participants.map((p) => [
      p.id,
      p.fullName,
      p.email,
      p.phone,
      p.gender ? String(p.gender).charAt(0).toUpperCase() + String(p.gender).slice(1) : "",
      p.photoUrl || p.photoBase64 ? (p.photoUrl || "Yes") : "No",
      p.designation,
      p.institution,
      p.address?.street || "",
      p.address?.city || "",
      p.address?.state || "",
      p.address?.postalCode || "",
      p.address?.country || "",
      p.paperSubmission ? "Yes" : "No",
      p.amount,
      p.paymentId || "",
      p.orderId || "",
      p.paidAt,
      p.createdAt,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="seminar-participants-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export participants" },
      { status: 500 }
    );
  }
}
