import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const correlationId = req.correlationId || req.headers['x-correlation-id'];
    const { method, originalUrl, body } = req;

    const now = Date.now();

    this.logger.log(
      `[${correlationId}] Request: ${method} ${originalUrl} Body: ${JSON.stringify(body)}`,
    );

    return next.handle().pipe(
      tap((response) => {
        const duration = Date.now() - now;
        this.logger.log(
          `[${correlationId}] Response: ${method} ${originalUrl} - ${duration}ms`,
        );
      }),
    );
  }
}
