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
      console.log("Google Sheets sync successful for", participant.email);
    } catch (err) {
      console.error("Google Sheets sync failed:", err);
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        if (err.message.includes("403") || err.message.includes("permission")) {
          console.error("→ Share the Google Sheet with the service account email (as Editor). Check client_email in your credentials JSON.");
        }
        if (err.message.includes("404") || err.message.includes("not found")) {
          console.error("→ Check GOOGLE_SHEET_ID is correct (from URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)");
        }
      }
    }
  } else {
    if (!process.env.GOOGLE_SHEETS_CREDENTIALS) {
      console.log("Google Sheets: GOOGLE_SHEETS_CREDENTIALS not set, skipping sync");
    }
    if (!process.env.GOOGLE_SHEET_ID) {
      console.log("Google Sheets: GOOGLE_SHEET_ID not set, skipping sync");
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
  let credentials: object;
  try {
    const credsStr = process.env.GOOGLE_SHEETS_CREDENTIALS!.trim();
    credentials = JSON.parse(credsStr);
  } catch (err) {
    throw new Error(
      "Invalid GOOGLE_SHEETS_CREDENTIALS: must be valid JSON (minify to single line, escape quotes if needed)"
    );
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID!.trim();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Sheet1!A:Q",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          participant.id,
          participant.fullName,
          participant.email,
          participant.phone,
          participant.gender ? String(participant.gender).charAt(0).toUpperCase() + String(participant.gender).slice(1) : "",
          participant.photoUrl || (participant.photoBase64 ? "Yes" : "No"),
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
