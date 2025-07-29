import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/entities/user.entity';
import { UserController } from './controllers/user.controller';
import { I18nHelperService } from '@/utils/i18n.helper';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthModule, // Import AuthModule to access guards and decorators
  ],
  controllers: [UserController],
  providers: [I18nHelperService],
  exports: [],
})
export class UserModule {} 