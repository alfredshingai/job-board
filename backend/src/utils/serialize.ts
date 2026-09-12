import type { Job, Company } from '@prisma/client';

type JobWithCompanyAndTags = Job & {
  company: Pick<Company, 'id' | 'name' | 'logoUrl' | 'website' | 'verified'>;
  tags: { tag: { name: string } }[];
};

/**
 * Flattens a Prisma job (with included company + tag rows) into the shape the
 * frontend consumes: `tags` becomes a plain array of strings and the company
 * is trimmed to its public fields.
 */
export function serializeJob(job: JobWithCompanyAndTags) {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    location: job.location,
    workplace: job.workplace,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    currency: job.currency,
    applyUrl: job.applyUrl,
    status: job.status,
    flagged: job.flagged,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    company: {
      id: job.company.id,
      name: job.company.name,
      logoUrl: job.company.logoUrl,
      website: job.company.website,
      verified: job.company.verified,
    },
    tags: job.tags.map((t) => t.tag.name),
  };
}

/**
 * Normalises user-provided tag strings: trims, lowercases, dedupes and
 * drops empties so " React , react,TS " -> ["react", "ts"].
 */
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0))];
}
