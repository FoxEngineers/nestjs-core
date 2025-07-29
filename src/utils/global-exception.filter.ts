import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nValidationException } from 'nestjs-i18n';
import { Logger } from '@/utils/logger';
import { I18nService } from 'nestjs-i18n';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getHttpStatus(exception);
    const message = this.getErrorMessage(exception);
    const context = this.extractContext(request);
    const stack = exception instanceof Error ? exception.stack : undefined;

    // Log the error with context (skip validation errors)
    if (!this.isValidationError(exception)) {
      this.logError(context, status, message, stack);
    }

    // Return standardized error response with British English
    const errorResponse = {
      statusCode: status,
      error: this.getLocalizedErrorMessage(status, message),
      ...((process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') && {
        stack: stack,
      }),
    };

    response.status(status).json(errorResponse);
  }

  private getHttpStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') {
        return response;
      }
      if (typeof response === 'object' && response !== null && 'message' in response) {
        const message = (response as any).message;
        return Array.isArray(message) ? message.join(', ') : message;
      }
    }
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private extractContext(request: Request): string {
    const { method, url, body, params, query } = request;
    const user = (request as any).user;

    // Extract relevant context based on the endpoint
    let context = `${method} ${url}`;

    // Add user context if available
    if (user?.email) {
      context += ` | User: ${user.email}`;
    }

    // Add specific context based on common patterns
    if (body?.email) {
      context += ` | Email: ${body.email}`;
    }

    if (params?.id) {
      context += ` | ID: ${params.id}`;
    }

    // Add query parameters if present
    if (Object.keys(query).length > 0) {
      context += ` | Query: ${JSON.stringify(query)}`;
    }

    return context;
  }

  private isValidationError(exception: unknown): boolean {
    return (
      exception instanceof I18nValidationException ||
      (exception instanceof BadRequestException &&
        typeof exception.message === 'string' &&
        (exception.message.includes('validation') ||
          Array.isArray((exception.getResponse() as any)?.message)))
        );
  }

  private getLocalizedErrorMessage(status: number, defaultMessage: string): string {
    // Use British English for common HTTP errors
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return this.i18n.t('errors.bad_request', { lang: 'en' });
      case HttpStatus.UNAUTHORIZED:
        return this.i18n.t('errors.unauthorised', { lang: 'en' });
      case HttpStatus.FORBIDDEN:
        return this.i18n.t('errors.forbidden', { lang: 'en' });
      case HttpStatus.NOT_FOUND:
        return this.i18n.t('errors.not_found', { lang: 'en' });
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return this.i18n.t('errors.internal_server_error', { lang: 'en' });
      default:
        return defaultMessage;
    }
  }

  private logError(context: string, status: number, message: string, stack: string|undefined): void {
    const logMessage = `${context} | Status: ${status} | Message: ${message}`;
    
    if (status >= 500) {
      this.logger.error(logMessage, stack);
    } else if (status >= 400) {
      this.logger.warn(logMessage, stack);
    } else {
      this.logger.log(logMessage, stack);
    }
  }
}
