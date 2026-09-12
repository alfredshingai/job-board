import type { Request } from 'express';

/**
 * Reads a single-value route parameter (`/jobs/:id`).
 *
 * Express 5 types `req.params` values as `string | string[]` because wildcard
 * routes (`/files/*path`) can capture arrays. Our routes only use named,
 * single-value params, so this helper gives handlers a plain `string`.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  return (Array.isArray(value) ? value[0] : value) ?? '';
}
