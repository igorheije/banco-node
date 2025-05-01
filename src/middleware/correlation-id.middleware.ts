import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function CorrelationIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  (req as any).correlationId = correlationId;
  next();
}
