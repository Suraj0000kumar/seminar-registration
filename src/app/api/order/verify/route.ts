import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import QRCode from "qrcode";
import { addParticipant } from "@/lib/participants";
import { uploadPhotoToCloud, isCloudStorageConfigured } from "@/lib/upload";
import type { Participant } from "@/types/registration";
import { FEE_STRUCTURE } from "@/types/registration";

function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    console.error("RAZORPAY_KEY_SECRET is not set in environment");
    return false;
  }
  const body = orderId + "|" + paymentId;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      paymentId,
      signature,
      formData,
    }: {
      orderId: string;
      paymentId: string;
      signature: string;
      formData: Omit<Participant, "id" | "qrCode" | "amount" | "paidAt" | "createdAt">;
    } = body;

    if (!orderId || !paymentId || !signature) {
      console.error("Missing payment data:", { orderId: !!orderId, paymentId: !!paymentId, signature: !!signature });
      return NextResponse.json(
        { error: "Invalid payment data received" },
        { status: 400 }
      );
    }

    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
      console.error("Signature verification failed. Check RAZORPAY_KEY_SECRET matches your Razorpay dashboard (Settings → API Keys).");
      return NextResponse.json(
        { error: "Payment verification failed. Please ensure RAZORPAY_KEY_SECRET in .env.local matches your Razorpay dashboard." },
        { status: 400 }
      );
    }

    const participantId = uuidv4();
    const qrPayload = JSON.stringify({
      id: participantId,
      email: formData.email,
      paidAt: new Date().toISOString(),
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
      width: 256,
      margin: 2,
    });

    const fees = FEE_STRUCTURE[formData.designation as keyof typeof FEE_STRUCTURE];
    const amount = formData.paperSubmission ? fees.base + fees.paper : fees.base;

    let photoUrl: string | undefined;
    if (formData.photoBase64 && isCloudStorageConfigured()) {
      try {
        photoUrl = await uploadPhotoToCloud(participantId, formData.photoBase64);
      } catch (err) {
        console.error("Photo upload failed, storing as base64:", err);
      }
    }

    const displayName = formData.prefix ? `${formData.prefix} ${formData.fullName}` : formData.fullName;

    const participant: Participant = {
      ...formData,
      id: participantId,
      fullName: displayName,
      qrCode: qrCodeDataUrl,
      amount,
      paymentId,
      orderId,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      photoUrl: photoUrl || formData.photoUrl,
      photoBase64: photoUrl ? undefined : formData.photoBase64,
    };

    await addParticipant(participant);

    return NextResponse.json({
      success: true,
      participantId,
      qrCode: qrCodeDataUrl,
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        amount: participant.amount,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Registration failed: ${message}` },
      { status: 500 }
    );
  }
}
