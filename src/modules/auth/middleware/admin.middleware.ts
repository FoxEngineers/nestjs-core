import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { I18nHelperService } from '@/utils/i18n.helper';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    is_admin: boolean;
  };
}

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  constructor(private i18nHelper: I18nHelperService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const user = req.user;
    
    if (!user) {
      throw new ForbiddenException(
        this.i18nHelper.t('auth.errors.authentication_required')
      );
    }
    
    if (!user.is_admin) {
      throw new ForbiddenException(
        this.i18nHelper.t('auth.errors.admin_access_required')
      );
    }
    
    next();
  }
} 