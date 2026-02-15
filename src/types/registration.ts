export type ParticipantType = "student" | "faculty" | "professional";

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  designation: ParticipantType;
  institution: string;
  paperSubmission: boolean;
  paymentId?: string;
  orderId?: string;
}

export interface Participant extends RegistrationFormData {
  id: string;
  qrCode: string;
  amount: number;
  paidAt: string;
  createdAt: string;
}

export const FEE_STRUCTURE = {
  student: { base: 250, paper: 1000 },
  faculty: { base: 350, paper: 1000 },
  professional: { base: 400, paper: 1000 },
} as const;
