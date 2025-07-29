import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto-js';
import { User } from '@/entities/user.entity';
import { PasswordResetToken } from '@/entities/password-reset-token.entity';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { HandlebarsEmailService } from '@/services/handlebars-email.service';
import { I18nHelperService } from '@/utils/i18n.helper';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
    private emailService: HandlebarsEmailService,
    private i18nHelper: I18nHelperService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password, password_confirmation, referral_code } = registerDto;

    // Check if passwords match
    if (password !== password_confirmation) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.passwords_do_not_match')
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ 
      where: { email },
      withDeleted: false 
    });
    
    if (existingUser) {
      throw new ConflictException(
        this.i18nHelper.t('auth.errors.user_already_exists')
      );
    }

    // Check referral code if provided
    let referredBy: string | undefined = undefined;
    if (referral_code) {
      const referrer = await this.userRepository.findOne({
        where: { referral_code },
        withDeleted: false
      });
      if (!referrer) {
        throw new BadRequestException(
          this.i18nHelper.t('auth.errors.invalid_referral_code')
        );
      }
      referredBy = referral_code;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique referral code for new user
    const newReferralCode = this.generateReferralCode();

    // Create user
    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
      referral_code: newReferralCode,
      referred_by: referredBy,
      is_admin: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Send verification email
    await this.sendVerificationEmail(savedUser);

    // Return user without password
    const { password: _, ...result } = savedUser;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException(
        this.i18nHelper.t('auth.errors.invalid_credentials')
      );
    }

    // Check if email is verified
    if (!user.email_verified_at) {
      throw new UnauthorizedException(
        this.i18nHelper.t('auth.errors.email_not_verified')
      );
    }

    // Update last login
    await this.userRepository.update(user.id, {
      last_login_at: new Date(),
    });

    // Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user.id, 
      is_admin: user.is_admin 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin,
        email_verified_at: user.email_verified_at,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      withDeleted: false 
    });
    
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async sendVerificationEmail(user: User) {
    const verificationHash = this.generateVerificationHash(user);
    const verificationUrl = `${this.configService.getOrThrow('FRONTEND_URL')}/verify-email/${user.id}/${verificationHash}`;
    
    await this.emailService.sendVerificationEmail(user.email, user.name, verificationUrl);
  }

  async verifyEmail(id: string, hash: string) {
    const user = await this.userRepository.findOne({ 
      where: { id },
      withDeleted: false 
    });
    
    if (!user) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_verification_link')
      );
    }

    if (user.email_verified_at) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.email_already_verified')
      );
    }

    const expectedHash = this.generateVerificationHash(user);
    if (hash !== expectedHash) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_verification_link')
      );
    }

    // Check if link is expired
    const verificationExpiryHours = this.configService.getOrThrow<number>('EMAIL_VERIFICATION_EXPIRY_HOURS');
    const createdAt = new Date(user.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > verificationExpiryHours) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.verification_link_expired')
      );
    }

    // Verify email
    await this.userRepository.update(user.id, {
      email_verified_at: new Date(),
    });

    return { 
      message: this.i18nHelper.t('auth.messages.email_verified_successfully')
    };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.userRepository.findOne({ 
      where: { email },
      withDeleted: false 
    });
    
    if (!user) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.user_not_found')
      );
    }

    if (user.email_verified_at) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.email_already_verified')
      );
    }

    await this.sendVerificationEmail(user);
    return { 
      message: this.i18nHelper.t('auth.messages.verification_email_sent')
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    const user = await this.userRepository.findOne({ 
      where: { email },
      withDeleted: false 
    });
    
    if (!user) {
      return { 
        message: this.i18nHelper.t('auth.messages.password_reset_link_sent')
      };
    }

    const resetToken = this.generateResetToken();
    const hashedToken = crypto.SHA256(resetToken).toString();
    const resetUrl = `${this.configService.getOrThrow('FRONTEND_URL')}/reset-password?token=${resetToken}&email=${email}`;
    
    await this.passwordResetTokenRepository.save({
      email,
      token: hashedToken,
      created_at: new Date(),
    });
    
    await this.emailService.sendPasswordResetEmail(user.email, user.name, resetUrl);
    
    return { 
      message: this.i18nHelper.t('auth.messages.password_reset_link_sent')
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, email, password, password_confirmation } = resetPasswordDto;

    if (password !== password_confirmation) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.passwords_do_not_match')
      );
    }

    // Validate token against stored hash
    const hashedToken = crypto.SHA256(token).toString();
    const resetTokenRecord = await this.passwordResetTokenRepository.findOne({
      where: { email, token: hashedToken }
    });

    if (!resetTokenRecord) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_reset_token')
      );
    }

    // Check if token has expired (based on PASSWORD_RESET_EXPIRY_HOURS)
    if (!resetTokenRecord.created_at) {
      // Invalid token record without creation time
      await this.passwordResetTokenRepository.delete({ email });
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_reset_token')
      );
    }

    const resetExpiryHours = this.configService.getOrThrow<number>('PASSWORD_RESET_EXPIRY_HOURS');
    const expiryTime = new Date(resetTokenRecord.created_at.getTime() + (resetExpiryHours * 60 * 60 * 1000));
    
    if (new Date() > expiryTime) {
      // Clean up expired token
      await this.passwordResetTokenRepository.delete({ email });
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_reset_token')
      );
    }
    
    const user = await this.userRepository.findOne({ 
      where: { email },
      withDeleted: false 
    });
    
    if (!user) {
      throw new BadRequestException(
        this.i18nHelper.t('auth.errors.invalid_reset_token')
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await this.userRepository.update(user.id, {
      password: hashedPassword,
    });

    // Clean up used token
    await this.passwordResetTokenRepository.delete({ email });

    return { 
      message: this.i18nHelper.t('auth.messages.password_reset_successfully')
    };
  }

  private generateReferralCode(): string {
    return crypto.lib.WordArray.random(4).toString().toUpperCase().substring(0, 8);
  }

  private generateVerificationHash(user: User): string {
    const data = `${user.id}${user.email}${user.created_at}`;
    return crypto.SHA256(data).toString();
  }

  private generateResetToken(): string {
    return crypto.lib.WordArray.random(32).toString();
  }
} 