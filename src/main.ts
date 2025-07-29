import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ConfigService } from '@nestjs/config';
import { I18nValidationPipe, I18nMiddleware } from 'nestjs-i18n';
import { CustomValidationFilter } from '@/utils/custom-validation.filter';
import { GlobalExceptionFilter } from '@/utils/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  
  app.use(I18nMiddleware);
  
  // Configure global validation with i18n support
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
    })
  );

  // Configure global exception filters
  app.useGlobalFilters(
    app.get(GlobalExceptionFilter),
    app.get(CustomValidationFilter),
  );

  const port = config.getOrThrow<number>('APP_PORT');
  await app.listen(port);
}
bootstrap();
