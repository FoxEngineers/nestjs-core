import { IsString, MinLength, Matches, IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'auth.validation.token_required' })
  @IsString({ message: 'auth.validation.token_string' })
  token: string;

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
} 