import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';
import { I18nHelperService } from '@/utils/i18n.helper';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private i18nHelper: I18nHelperService) {}
  
  // Accessible by all authenticated users
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      message: this.i18nHelper.t('auth.messages.user_profile'),
      user: {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
    };
  }
} 