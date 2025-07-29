import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from '@nestjs/config';
// import { ThrottlerModule } from '@nestjs/throttler';
import { I18nModule, AcceptLanguageResolver, HeaderResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';
import { getDatabaseConfig } from '@/config/database.config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UserModule } from '@/modules/user/user.module';
import { CustomValidationFilter } from '@/utils/custom-validation.filter';
import { GlobalExceptionFilter } from '@/utils/global-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return getDatabaseConfig(configService);
      },
    }),
    // ThrottlerModule.forRoot([{
    //   ttl: 60000, // 1 minute
    //   limit: 10,  // 10 requests per minute
    // }]),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.getOrThrow<string>('APP_LOCALE'),
        loaderOptions: {
          path: path.join(__dirname, 'i18n'),
          watch: true,
        },
        typesOutputPath: path.join(process.cwd(), 'src/generated/i18n.generated.ts'),
      }),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-lang']),
        AcceptLanguageResolver,
      ],
    }),
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, CustomValidationFilter, GlobalExceptionFilter],
})
export class AppModule { }