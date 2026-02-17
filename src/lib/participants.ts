import { Participant } from "@/types/registration";
import { google } from "googleapis";

const PARTICIPANTS_FILE = "participants.json";

function isGoogleSheetsConfigured(): boolean {
  return !!(process.env.GOOGLE_SHEETS_CREDENTIALS && process.env.GOOGLE_SHEET_ID);
}

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

async function saveParticipantsToFile(participants: Participant[]): Promise<boolean> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, PARTICIPANTS_FILE),
      JSON.stringify(participants, null, 2)
    );
    return true;
  } catch (err) {
    console.warn("File storage unavailable (normal on Vercel):", err instanceof Error ? err.message : err);
    return false;
  }
}

export async function addParticipant(participant: Participant): Promise<void> {
  const participants = await getParticipantsFromFile();
  participants.push(participant);
  const fileSaved = await saveParticipantsToFile(participants);

  if (isGoogleSheetsConfigured()) {
    try {
      await appendToGoogleSheet(participant);
      console.log("Google Sheets sync successful for", participant.email);
    } catch (err) {
      console.error("Google Sheets sync failed:", err);
      if (err instanceof Error) {
        if (err.message.includes("403") || err.message.includes("permission")) {
          console.error("→ Share the Google Sheet with the service account email (as Editor).");
        }
        if (err.message.includes("404") || err.message.includes("not found")) {
          console.error("→ Check GOOGLE_SHEET_ID is correct.");
        }
      }
      throw err;
    }
  } else if (!fileSaved) {
    throw new Error(
      "No storage available. On Vercel, configure GOOGLE_SHEET_ID and GOOGLE_SHEETS_CREDENTIALS. Locally, ensure the data/ directory is writable."
    );
  }
}

async function getParticipantsFromSheet(): Promise<Participant[]> {
  if (!isGoogleSheetsConfigured()) return [];
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!.trim());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!.trim(),
      range: "Sheet1!A2:O",
    });
    const rows = (res.data.values as string[][]) || [];
    return rows.map((row) => ({
      id: row[0] || "",
      fullName: row[1] || "",
      email: row[2] || "",
      phone: row[3] || "",
      gender: (row[4]?.toLowerCase() as "male" | "female" | "other") || undefined,
      photoUrl: row[5] && row[5] !== "Yes" && row[5] !== "No" ? row[5] : undefined,
      designation: (row[6]?.toLowerCase() as "student" | "faculty" | "professional") || "student",
      institution: row[7] || "",
      paperSubmission: row[8] === "Yes",
      amount: Number(row[9]) || 0,
      paymentId: row[10] || undefined,
      orderId: row[11] || undefined,
      paidAt: row[12] || "",
      createdAt: row[13] || "",
      qrCode: row[14] || "",
    }));
  } catch (err) {
    console.error("Failed to read from Google Sheets:", err);
    return [];
  }
}

export async function getAllParticipants(): Promise<Participant[]> {
  const fromFile = await getParticipantsFromFile();
  if (fromFile.length > 0) return fromFile;
  return getParticipantsFromSheet();
}

export async function getParticipantById(id: string): Promise<Participant | null> {
  const fromFile = await getParticipantsFromFile();
  const found = fromFile.find((p) => p.id === id);
  if (found) return found;
  const fromSheet = await getParticipantsFromSheet();
  return fromSheet.find((p) => p.id === id) ?? null;
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
