import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nValidationException, I18nService, I18nContext } from 'nestjs-i18n';

@Injectable()
@Catch(I18nValidationException, BadRequestException)
export class CustomValidationFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: I18nValidationException | BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const i18nContext = I18nContext.current(host);
    const currentLang = i18nContext?.lang || 'vi';

    let errors: Record<string, string[]> = {};

    if (exception instanceof I18nValidationException) {
      // Access errors directly from the exception
      if (exception.errors && Array.isArray(exception.errors)) {
        exception.errors.forEach((error) => {
          if (error.property && error.constraints) {
            const property = error.property;
            const constraints = error.constraints || {};
            
            // Translate each constraint message
            const translatedMessages: string[] = [];
            
            Object.values(constraints).forEach((message: string) => {
              if (typeof message === 'string') {
                // Translate the message key
                const translated = this.i18n.t(message, { lang: currentLang });
                translatedMessages.push(String(translated));
              }
            });
            
            errors[property] = translatedMessages;
          }
        });
      }
    } else if (exception instanceof BadRequestException) {
      // Handle regular BadRequestException
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const message = (exceptionResponse as any).message;
        
        if (Array.isArray(message)) {
          // If message is array of validation error objects
          message.forEach((error) => {
            if (typeof error === 'object' && error.property && error.constraints) {
              const property = error.property;
              const constraints = error.constraints || {};
              errors[property] = Object.values(constraints);
            }
          });
        } else if (typeof message === 'string') {
          // If message is a simple string
          errors.general = [message];
        }
      }
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      errors,
    });
  }
} 