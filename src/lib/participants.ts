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
      range: "Sheet1!A2:T",
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
      address: {
        street: row[9] || "",
        city: row[10] || "",
        state: row[11] || "",
        postalCode: row[12] || "",
        country: row[13] || "",
      },
      paperSubmission: row[8] === "Yes",
      amount: Number(row[14]) || 0,
      paymentId: row[15] || undefined,
      orderId: row[16] || undefined,
      paidAt: row[17] || "",
      createdAt: row[18] || "",
      qrCode: row[19] || "",
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
    range: "Sheet1!A:T",
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
          participant.address.street,
          participant.address.city,
          participant.address.state,
          participant.address.postalCode,
          participant.address.country,
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
export async function deleteParticipant(id: string): Promise<void> {
  const participants = await getParticipantsFromFile();
  const filtered = participants.filter((p) => p.id !== id);
  await saveParticipantsToFile(filtered);

  if (isGoogleSheetsConfigured()) {
    try {
      const credentials = JSON.parse(process.env.GOOGLE_SHEETS_CREDENTIALS!.trim());
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheetId = process.env.GOOGLE_SHEET_ID!.trim();
      
      // Get all rows to find the one to delete
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: "Sheet1!A2:A",
      });
      
      const rows = (res.data.values as string[][]) || [];
      const rowIndex = rows.findIndex((row) => row[0] === id);
      
      if (rowIndex !== -1) {
        // Delete the row (row index + 2 because rows start at 1 and headers are row 1)
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0,
                    dimension: "ROWS",
                    startIndex: rowIndex + 1,
                    endIndex: rowIndex + 2,
                  },
                },
              },
            ],
          },
        });
        console.log("Participant deleted from Google Sheets:", id);
      }
    } catch (err) {
      console.error("Failed to delete from Google Sheets:", err);
    }
  }
}