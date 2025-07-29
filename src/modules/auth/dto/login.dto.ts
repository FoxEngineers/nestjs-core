import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'auth.validation.email_required' })
  @IsEmail({}, { message: 'auth.validation.email_invalid' })
  email: string;
  
  @IsNotEmpty({ message: 'auth.validation.password_required' })
  @IsString({ message: 'auth.validation.password_string' })
  password: string;
} 