import { NextRequest, NextResponse } from "next/server";
import { getParticipantById } from "@/lib/participants";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { valid: false, error: "Missing participant ID" },
        { status: 400 }
      );
    }

    const participant = await getParticipantById(id);
    if (!participant) {
      return NextResponse.json({ valid: false, error: "Participant not found" });
    }

    return NextResponse.json({
      valid: true,
      participant: {
        fullName: participant.fullName,
        email: participant.email,
        designation: participant.designation,
        institution: participant.institution,
      },
    });
  } catch (error) {
    console.error("QR verification error:", error);
    return NextResponse.json(
      { valid: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
