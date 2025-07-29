import { Injectable } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { ConfigService } from '@nestjs/config';

export function getCurrentLanguage(configService?: ConfigService): string {
  const currentLang = I18nContext.current()?.lang;
  if (currentLang) {
    return currentLang;
  }
  
  if (configService) {
    const appLocale = configService.getOrThrow<string>('APP_LOCALE');
    if (appLocale) {
      return appLocale;
    }
  }
  
  // Final fallback
  return process.env.APP_LOCALE || 'vi';
}

/**
 * Global I18n Helper Service
 * Provides simplified translation methods without manual language detection
 * 
 * Usage:
 * - Instead of: this.i18n.t('key', { lang: I18nContext.current()?.lang || ... })
 * - Use: this.i18nHelper.t('key')
 */
@Injectable()
export class I18nHelperService {
  constructor(
    private i18n: I18nService,
    private configService: ConfigService,
  ) {}

  /**
   * Translate a key with automatic language detection
   * @param key Translation key (e.g., 'auth.errors.invalid_credentials')
   * @param args Optional arguments for interpolation
   * @param lang
   * @returns Translated string
   */
  t(key: string, args?: Record<string, any>, lang?: string): string {
    const defaultLang = getCurrentLanguage(this.configService);

    if (!lang) {
      lang = defaultLang;
    }

    return this.i18n.t(key, { lang, args });
  }
  
  getCurrentLanguage() {
    return getCurrentLanguage(this.configService);
  }
}