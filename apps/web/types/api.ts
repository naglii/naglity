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

export type PricingMode = 'FIXED' | 'OFFERS';
export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';

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

export interface BusinessStats {
  jobsByStatus: Record<JobStatus, number>;
  totalGrossSpendCents: number;
}

export interface AdminStats {
  driversCount: number;
  businessesCount: number;
  totalJobs: number;
  jobsByStatus: Record<JobStatus, number>;
  totalGrossCents: number;
  totalPlatformRevenueCents: number;
  totalDriverPayoutsCents: number;
}

export interface AdminDriverDetail extends Driver {
  user: { username: string; email?: string | null };
  jobs: Job[];
  stats: DriverStats;
}

export interface AdminBusinessDetail extends Business {
  user: { username: string; email?: string | null };
  jobs: Job[];
  stats: BusinessStats;
}

export interface CreateJobDto {
  title: string;
  description?: string;
  grossPriceCents: number;
  pricingMode?: PricingMode;
  scheduledAt: string;
  estimatedEndAt: string;
  fromLocation: string;
  toLocation: string;
  craneCapacityTons?: number;
  liftHeightMeters?: number;
  loadType?: string;
  accessNotes?: string;
}

export interface CreateDriverDto {
  username: string;
  email?: string;
  password: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
  craneCapacityTons?: number;
  liftHeightMeters?: number;
}

export interface CreateBusinessDto {
  username: string;
  email?: string;
  password: string;
  name: string;
  phone: string;
}

export type SignupRequestType = 'DRIVER' | 'BUSINESS';

export interface SignupRequest {
  id: string;
  type: SignupRequestType;
  name: string;
  businessName: string | null;
  phone: string;
  email: string | null;
  details: string | null;
  craneCapacityTons: number | null;
  liftHeightMeters: number | null;
  handled: boolean;
  createdAt: string;
}

export interface CreateSignupRequestDto {
  type: SignupRequestType;
  name: string;
  businessName?: string;
  phone: string;
  email?: string;
  details?: string;
  craneCapacityTons?: number;
  liftHeightMeters?: number;
}
