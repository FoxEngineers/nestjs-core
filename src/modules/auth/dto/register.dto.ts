import { IsEmail, IsString, MinLength, IsOptional, Matches, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'auth.validation.name_required' })
  @IsString({ message: 'auth.validation.name_string' })
  @MinLength(2, { message: 'auth.validation.name_min_length' })
  name: string;

  @IsNotEmpty({ message: 'auth.validation.email_required' })
  @IsEmail({}, { message: 'auth.validation.email_invalid' })
  email: string;

  @IsNotEmpty({ message: 'auth.validation.password_required' })
  @IsString({ message: 'auth.validation.password_string' })
  @MinLength(8, { message: 'auth.validation.password_min_length' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'auth.errors.password_requirements',
  })
  password: string;

  @IsNotEmpty({ message: 'auth.validation.password_confirmation_required' })
  @IsString({ message: 'auth.validation.password_confirmation_string' })
  password_confirmation: string;

  @IsOptional()
  @IsString({ message: 'auth.validation.referral_code_string' })
  referral_code?: string;
} 