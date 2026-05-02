import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import type { RequestWithId } from '../interfaces/request-with-id';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const requestId =
      request.headers['x-request-id']?.toString() ?? crypto.randomUUID();

    request.requestId = requestId;
    response.setHeader('x-request-id', requestId);

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        console.info(
          JSON.stringify({
            level: 'info',
            requestId,
            method: request.method,
            path: request.url,
            duration,
          }),
        );
      }),
    );
  }
}
