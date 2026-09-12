import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { ApiError } from '../utils/errors.js';

/** 404 for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' });
}

/**
 * Central error handler — the single place that maps errors to HTTP responses.
 * Express 5 forwards rejected async handlers here automatically.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Known, intentional errors -> return as-is
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, details: err.details });
  }

  // Zod errors raised outside the validate middleware
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', details: err.flatten().fieldErrors });
  }

  // Prisma unique-constraint violations -> 409 Conflict
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return res.status(409).json({ message: 'That value is already taken' });
  }

  // Unexpected errors -> log and return a generic 500 (never leak internals)
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
}
