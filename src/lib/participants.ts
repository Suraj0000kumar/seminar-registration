import { Participant } from "@/types/registration";
import { google } from "googleapis";

const PARTICIPANTS_FILE = "participants.json";

async function getParticipantsFromFile(): Promise<Participant[]> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", PARTICIPANTS_FILE);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveParticipantsToFile(participants: Participant[]): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, PARTICIPANTS_FILE),
    JSON.stringify(participants, null, 2)
  );
}

export async function addParticipant(participant: Participant): Promise<void> {
  const participants = await getParticipantsFromFile();
  participants.push(participant);
  await saveParticipantsToFile(participants);

  // Try to sync to Google Sheets if configured
  if (process.env.GOOGLE_SHEETS_CREDENTIALS && process.env.GOOGLE_SHEET_ID) {
    try {
      await appendToGoogleSheet(participant);
    } catch (err) {
      console.error("Google Sheets sync failed:", err);
    }
  }
}

export async function getAllParticipants(): Promise<Participant[]> {
  return getParticipantsFromFile();
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  const participants = await getParticipantsFromFile();
  return participants.find((p) => p.id === id) ?? null;
}

async function appendToGoogleSheet(participant: Participant): Promise<void> {
  const credentials = JSON.parse(
    process.env.GOOGLE_SHEETS_CREDENTIALS as string
  );
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A:P",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          participant.id,
          participant.fullName,
          participant.email,
          participant.phone,
          participant.gender ? String(participant.gender).charAt(0).toUpperCase() + String(participant.gender).slice(1) : "",
          participant.designation,
          participant.institution,
          participant.paperSubmission ? "Yes" : "No",
          participant.amount,
          participant.paymentId || "",
          participant.orderId || "",
          participant.paidAt,
          participant.createdAt,
          participant.qrCode,
        ],
      ],
    },
  });
}
