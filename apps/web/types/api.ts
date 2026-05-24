export type Role = 'ADMIN' | 'DRIVER' | 'BUSINESS';
export type JobStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAID' | 'DELETED';
export type NotificationType = 'JOB_ACCEPTED_BY_DRIVER' | 'JOB_CANCELLED_BY_DRIVER' | 'JOB_DELETED_BY_BUSINESS';

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
}

export interface LoginResponse {
  user: AuthUser;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
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
  createdAt: string;
  updatedAt: string;
  business?: { id: string; name: string; phone?: string };
  driver?: { id: string; name: string; phone?: string } | null;
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
  scheduledAt: string;
  estimatedEndAt: string;
  fromLocation: string;
  toLocation: string;
}

export interface CreateDriverDto {
  username: string;
  email?: string;
  password: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType?: string;
}

export interface CreateBusinessDto {
  username: string;
  email?: string;
  password: string;
  name: string;
  phone: string;
}
