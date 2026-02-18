import { NextRequest, NextResponse } from "next/server";
import { getParticipantById } from "@/lib/participants";
import { saveParticipantsToFile, getAllParticipants } from "@/lib/participants";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing participant ID", valid: false },
        { status: 400 }
      );
    }

    const participant = await getParticipantById(id);

    if (!participant) {
      return NextResponse.json(
        {
          valid: false,
          error: "Participant not found in registration list",
        },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (participant.checkedInAt) {
      // Already checked in
      return NextResponse.json({
        valid: true,
        status: "already_checked_in",
        message: `${participant.fullName} already checked in at ${new Date(
          participant.checkedInAt
        ).toLocaleTimeString()}`,
        participant: {
          id: participant.id,
          fullName: participant.fullName,
          email: participant.email,
          designation: participant.designation,
          institution: participant.institution,
          checkedInAt: participant.checkedInAt,
        },
      });
    }

    // Update participant with check-in timestamp
    const allParticipants = await getAllParticipants();
    const updated = allParticipants.map((p) =>
      p.id === id ? { ...p, checkedInAt: now } : p
    );

    // Save updated list
    await import("fs/promises").then(async (fs) => {
      const path = await import("path");
      const dir = path.join(process.cwd(), "data");
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        path.join(dir, "participants.json"),
        JSON.stringify(updated, null, 2)
      );
    });

    return NextResponse.json({
      valid: true,
      status: "checked_in",
      message: `Welcome ${participant.fullName}! You have been checked in.`,
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        designation: participant.designation,
        institution: participant.institution,
        checkedInAt: now,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to process check-in",
      },
      { status: 500 }
    );
  }
}
