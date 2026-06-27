// Mirrored verbatim from apps/web/types/api.ts — keep in sync with the web app.
// The API contract is identical; mobile must not diverge from these shapes.

export type Role = 'ADMIN' | 'DRIVER' | 'BUSINESS';
export type JobStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'DELETED';
export type NotificationType =
  | 'JOB_ACCEPTED_BY_DRIVER'
  | 'JOB_CANCELLED_BY_DRIVER'
  | 'JOB_DELETED_BY_BUSINESS'
  | 'SIGNUP_REQUEST'
  | 'PAYMENT_FAILED'
  | 'NEW_OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'JOB_INVITE'
  | 'NEW_REVIEW';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  jobId: string | null;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  role: Role;
  profileId: string | null;
  accountType?: 'INDIVIDUAL' | 'BUSINESS' | null;
  phoneVerified?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  craneCapacityTons?: number | null;
  liftHeightMeters?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  userId: string;
  name: string;
  phone: string;
  location?: string | null;
  accountType?: 'INDIVIDUAL' | 'BUSINESS';
  phoneVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  businessId: string;
  driverId: string | null;
  status: JobStatus;
  title: string;
  description: string | null;
  grossPriceCents: number;
  netPriceCents: number;
  scheduledAt: string;
  estimatedEndAt: string;
  fromLocation: string;
  toLocation: string;
  craneCapacityTons?: number | null;
  liftHeightMeters?: number | null;
  loadType?: string | null;
  accessNotes?: string | null;
  pricingMode?: PricingMode;
  offerCount?: number;
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; phone?: string };
  driver?: { id: string; name: string; phone?: string } | null;
  escrowStatus?: EscrowStatus;
}

export type PricingMode = 'LOCATION' | 'FIXED' | 'OFFERS';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

export interface PriceEstimate {
  grossPriceCents: number;
  distanceKm: number;
}

export interface DriverRating {
  avg: number;
  count: number;
}

export interface DriverDirectoryItem {
  id: string;
  name: string;
  vehicleType: string;
  craneCapacityTons?: number | null;
  liftHeightMeters?: number | null;
  rating: DriverRating;
  completedJobs: number;
}

export interface JobOffer {
  id: string;
  jobId: string;
  driverId: string;
  amountCents: number;
  note?: string | null;
  etaMinutes?: number | null;
  status: OfferStatus;
  createdAt: string;
  driver?: {
    id: string;
    name: string;
    vehicleType?: string;
    craneCapacityTons?: number | null;
    liftHeightMeters?: number | null;
    rating?: DriverRating;
  };
  job?: {
    id: string;
    title: string;
    fromLocation: string;
    toLocation: string;
    scheduledAt: string;
    status: JobStatus;
    grossPriceCents: number;
  };
}

export type EscrowStatus = 'NONE' | 'IN_ESCROW' | 'RELEASED' | 'REFUNDED';

export interface BillingStatus {
  hasPaymentMethod: boolean;
  provider: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  heldInEscrowCents?: number;
}

export interface BillingTransaction {
  id: string;
  jobId: string;
  jobTitle: string;
  type: 'CHARGE' | 'REFUND';
  amountCents: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
}

export interface PayoutAccountStatus {
  payoutsEnabled: boolean;
  provider: string;
  payoutLast4?: string | null;
}

export interface AdminTransaction {
  id: string;
  jobId: string;
  jobTitle: string;
  businessName: string | null;
  driverName: string | null;
  type: 'CHARGE' | 'TRANSFER' | 'REFUND';
  amountCents: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  provider: string;
  providerRef: string | null;
  createdAt: string;
}

export interface DriverPayout {
  id: string;
  jobId: string;
  jobTitle: string;
  scheduledAt: string;
  fromLocation: string;
  toLocation: string;
  amountCents: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  createdAt: string;
}

export interface Receipt {
  invoiceNumber: string;
  issuedAt: string;
  job: { id: string; title: string; scheduledAt: string; fromLocation: string; toLocation: string };
  businessName: string | null;
  driverName: string | null;
  grossCents: number;
  platformFeeCents: number;
  netCents: number;
  charged: boolean;
  chargedAt: string | null;
  released: boolean;
  releasedAt: string | null;
  refunded: boolean;
  refundedAt: string | null;
}

export interface DriverStats {
  jobsByStatus: Record<JobStatus, number>;
  totalNetEarningsCents: number;
}
