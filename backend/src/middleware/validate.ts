import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ApiError } from '../utils/errors.js';

type Part = 'body' | 'query';

/**
 * Zod validation middleware factory.
 * Parses and *replaces* the given request part, so handlers receive typed,
 * defaulted data (e.g. `?page=3` becomes the number 3).
 *
 * Note: in Express 5, `req.query` is a prototype getter that re-parses the
 * query string on every access. We shadow it with an own, writable property
 * holding the parsed result — mutating the object would be silently lost.
 */
export function validate(part: Part, schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(ApiError.badRequest('Validation failed', result.error.flatten().fieldErrors));
    }
    if (part === 'query') {
      Object.defineProperty(req, 'query', {
        value: result.data,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    } else {
      req.body = result.data;
    }
    next();
  };
}
