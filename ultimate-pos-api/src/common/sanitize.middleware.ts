import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Recursively strips HTML tags from all string values in an object/array.
 * Covers request body to prevent XSS via stored input.
 */
function stripHtml(value: unknown): unknown {
  if (typeof value === 'string') {
    // Remove all HTML tags and trim whitespace
    return value.replace(/<[^>]*>/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(stripHtml);
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        stripHtml(v),
      ]),
    );
  }
  return value;
}

@Injectable()
export class SanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction): void {
    if (req.body && typeof req.body === 'object') {
      req.body = stripHtml(req.body) as Record<string, unknown>;
    }
    next();
  }
}
