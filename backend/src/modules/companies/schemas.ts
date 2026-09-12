import { z } from 'zod';

/** Treats "" (common when a form field is left blank) as "not provided". */
const optionalUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().trim().url('Must be a valid URL').max(500).optional(),
);

export const companySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  website: optionalUrl,
  logoUrl: optionalUrl,
  description: z.string().trim().max(2000).optional(),
  location: z.string().trim().max(120).optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
