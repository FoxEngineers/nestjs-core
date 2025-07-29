import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '@/entities/user.entity';
import { PasswordResetToken } from '@/entities/password-reset-token.entity';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { HandlebarsEmailService } from '@/services/handlebars-email.service';
import { I18nHelperService } from '@/utils/i18n.helper';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PasswordResetToken]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRY_DEFAULT')
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    LocalAuthGuard,
    RolesGuard,
    I18nHelperService,
    HandlebarsEmailService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {} 