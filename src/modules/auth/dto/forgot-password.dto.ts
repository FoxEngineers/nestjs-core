import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'auth.validation.email_required' })
  @IsEmail({}, { message: 'auth.validation.email_invalid' })
  email: string;
} 