import { z } from 'zod';

/** Treats "" as "not provided" so empty form fields don't fail validation. */
const optionalInt = (max: number) =>
  z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(0).max(max).optional(),
  );

/** Shared shape for create + update. */
const jobBaseSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120),
  description: z
    .string()
    .trim()
    .min(30, 'Description must be at least 30 characters')
    .max(8000),
  location: z.string().trim().min(2, 'Location is required').max(120),
  workplace: z.enum(['ONSITE', 'HYBRID', 'REMOTE']).default('ONSITE'),
  salaryMin: optionalInt(10_000_000),
  salaryMax: optionalInt(10_000_000),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter code (e.g. USD)')
    .toUpperCase()
    .default('USD'),
  applyUrl: z.string().trim().url('Must be a valid URL').max(500),
  tags: z.array(z.string().trim().min(1).max(30)).max(10, 'At most 10 tags').default([]),
});

export const jobCreateSchema = jobBaseSchema.refine(
  (d) => d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMax >= d.salaryMin,
  { message: 'Maximum salary must be greater than or equal to minimum salary', path: ['salaryMax'] },
);

export const jobUpdateSchema = jobBaseSchema
  .partial()
  .refine(
    (d) => d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMax >= d.salaryMin,
    { message: 'Maximum salary must be greater than or equal to minimum salary', path: ['salaryMax'] },
  );

/** Body of POST /api/jobs/:id/applications (in-app apply). */
export const applicationSchema = z.object({
  coverLetter: z
    .string()
    .trim()
    .min(20, 'Cover letter must be at least 20 characters')
    .max(4000),
  resumeUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().url('Must be a valid URL').max(500).optional(),
  ),
});

/**
 * Public job list query params.
 * Sorts: newest | oldest | salary_high (salaryMax desc) | salary_low (salaryMin asc).
 */
export const jobQuerySchema = z.object({
  q: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(100).optional(),
  ),
  location: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().trim().max(120).optional(),
  ),
  workplace: z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.enum(['ONSITE', 'HYBRID', 'REMOTE']).optional(),
  ),
  salaryMin: optionalInt(10_000_000),
  salaryMax: optionalInt(10_000_000),
  tags: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().max(300).optional(), // comma-separated tag names
  ),
  sort: z.enum(['newest', 'oldest', 'salary_high', 'salary_low']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export type JobQuery = z.infer<typeof jobQuerySchema>;
