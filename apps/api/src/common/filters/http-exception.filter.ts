import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ZodError } from 'zod';

import type { RequestWithId } from '../interfaces/request-with-id';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithId>();

    const requestId = request.requestId ?? 'unknown';

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      response.status(exception.getStatus()).json({
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        ...(typeof payload === 'string'
          ? { code: 'HTTP_EXCEPTION', message: payload }
          : (payload as object)),
      });
      return;
    }

    if (exception instanceof ZodError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        requestId,
        timestamp: new Date().toISOString(),
        path: request.url,
        code: 'VALIDATION_FAILED',
        message: 'Schema validation failed',
        details: exception.flatten(),
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务端发生未处理异常',
    });
  }
}
