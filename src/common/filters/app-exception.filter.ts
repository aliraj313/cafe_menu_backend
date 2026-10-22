import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AppException } from '../exceptions/app.exception';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();
    const requestId = request.requestId ?? randomUUID();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'An unexpected error occurred.';
    let details: unknown[] = [];

    if (exception instanceof AppException) {
      status = exception.getStatus();
      const body = exception.getResponse() as {
        error?: { code?: string; message?: string; details?: unknown[] };
      };
      code = body.error?.code ?? exception.code;
      message = body.error?.message ?? exception.message;
      details = body.error?.details ?? exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        code = 'HTTP_ERROR';
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, unknown>;
        if (Array.isArray(obj.message)) {
          code = 'VALIDATION_FAILED';
          message = 'Validation failed.';
          details = obj.message as unknown[];
        } else {
          message = (obj.message as string) ?? exception.message;
          code = (obj.error as string) ?? 'HTTP_ERROR';
        }
      }
    } else {
      this.logger.error(
        { requestId, err: exception },
        'Unhandled exception',
      );
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
        requestId,
      },
    });
  }
}
