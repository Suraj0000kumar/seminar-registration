import { put } from "@vercel/blob";

/**
 * Upload photo to Vercel Blob storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPhotoToCloud(
  participantId: string,
  photoBase64: string
): Promise<string> {
  const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const blob = await put(`participants/${participantId}.jpg`, buffer, {
    access: "public",
    contentType: "image/jpeg",
  });
  return blob.url;
}

export function isCloudStorageConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}
