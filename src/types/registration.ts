export type ParticipantType = "student" | "faculty" | "professional";

export type Gender = "male" | "female" | "other";

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  gender?: Gender;
  designation: ParticipantType;
  institution: string;
  address: Address;
  paperSubmission: boolean;
  photoBase64?: string;
  photoUrl?: string;
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
  student: { base: 250, paper: 500 },
  faculty: { base: 350, paper: 1000 },
  professional: { base: 400, paper: 1000 },
} as const;
