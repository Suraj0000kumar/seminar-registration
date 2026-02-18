import { NextRequest, NextResponse } from "next/server";
import { deleteParticipant } from "@/lib/participants";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing participant ID" },
        { status: 400 }
      );
    }

    await deleteParticipant(id);

    return NextResponse.json({
      success: true,
      message: "Participant deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to delete participant: ${message}` },
      { status: 500 }
    );
  }
}
