export type Role = 'USER' | 'COMPANY' | 'ADMIN';
export type Workplace = 'ONSITE' | 'HYBRID' | 'REMOTE';
export type JobStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  workplace: Workplace;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  applyUrl: string;
  status: JobStatus;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
  company: { id: string; name: string; logoUrl: string | null; website: string | null; verified: boolean };
  tags: string[];
};

export type Paginated<T> = {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export type AuthUser = { id: string; email: string; name: string; role: Role };
export type AuthResponse = { user: AuthUser; token: string };

export type Company = {
  id: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  description: string | null;
  location: string | null;
  verified: boolean;
  userId: string;
};
