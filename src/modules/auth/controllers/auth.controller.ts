import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Request, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { Public } from '../decorators/public.decorator';
import { I18nHelperService } from '@/utils/i18n.helper';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private i18nHelper: I18nHelperService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any) {
    return { 
      message: this.i18nHelper.t('auth.messages.logged_out_successfully')
    };
  }

  @Get('user')
  async getUser(@CurrentUser() user: any) {
    return {
      id: user.id,
      email: user.email,
      is_admin: user.is_admin,
    };
  }

  @Public()
  @Get('verify-email/:id/:hash')
  async verifyEmail(@Param('id') id: string, @Param('hash') hash: string) {
    return await this.authService.verifyEmail(id, hash);
  }

  @Public()
  @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 request per minute
  @Post('email/verification-notification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationEmail(@Body('email') email: string) {
    return await this.authService.resendVerificationEmail(email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
} 