import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { I18nHelperService } from '@/utils/i18n.helper';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface BaseTemplateData {
  lang: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
  defaultFooterText: string;
  rightsReserved: string;
  currentYear: number;
}

@Injectable()
export class HandlebarsEmailService {
  private readonly logger = new Logger(HandlebarsEmailService.name);
  private transporter: nodemailer.Transporter;
  private templateCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(
    private configService: ConfigService,
    private i18nHelper: I18nHelperService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('MAIL_HOST'),
      port: this.configService.getOrThrow<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.configService.getOrThrow<string>('MAIL_USERNAME'),
        pass: this.configService.getOrThrow<string>('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Get app name from environment variables
   */
  private getAppName(): string {
    return this.configService.getOrThrow<string>('APP_NAME');
  }

  /**
   * Format expiry time based on hours
   */
  private formatExpiryTime(hours: number): string {
    const lang = this.i18nHelper.getCurrentLanguage();
    
    if (lang === 'vi') {
      if (hours === 1) {
        return '1 giờ';
      } else if (hours === 24) {
        return '24 giờ';
      } else {
        return `${hours} giờ`;
      }
    } else {
      if (hours === 1) {
        return '1 hour';
      } else if (hours === 24) {
        return '24 hours';
      } else {
        return `${hours} hours`;
      }
    }
  }

  /**
   * Load and compile a handlebars template
   */
  private async loadTemplate(templateName: string): Promise<handlebars.TemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'email',
      `${templateName}.hbs`
    );

    try {
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      this.logger.error(`Failed to load email template: ${templateName}`, error.stack);
      throw new Error(`Failed to load email template: ${templateName}. Error: ${error.message}`);
    }
  }

  /**
   * Render email using base template and content template
   */
  private async renderEmail(
    contentTemplateName: string,
    contentData: any,
    baseData: BaseTemplateData
  ): Promise<string> {
    // Load content template
    const contentTemplate = await this.loadTemplate(contentTemplateName);
    const contentHtml = contentTemplate(contentData);

    // Load base template
    const baseTemplate = await this.loadTemplate('base');
    return baseTemplate({
      ...baseData,
      content: contentHtml,
    });
  }

  /**
   * Get base template data with i18n support
   */
  private getBaseTemplateData(
    title: string,
    buttonText?: string,
    buttonUrl?: string,
    footerText?: string
  ): BaseTemplateData {
    const lang = this.i18nHelper.getCurrentLanguage();
    const appName = this.getAppName();
    
    return {
      lang,
      title,
      content: '', // Will be filled by content template
      buttonText,
      buttonUrl,
      footerText,
      defaultFooterText: this.i18nHelper.t('auth.email.common.default_footer', { appName }),
      rightsReserved: this.i18nHelper.t('auth.email.common.rights_reserved'),
      currentYear: new Date().getFullYear(),
    };
  }

  /**
   * Send a generic email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: options.from || this.configService.getOrThrow<string>('MAIL_FROM'),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}`, error.stack);
      throw new Error(`Failed to send email to ${options.to}. Error: ${error.message}`);
    }
  }

  /**
   * Send email verification email using handlebars template
   */
  async sendVerificationEmail(email: string, name: string, verificationUrl: string): Promise<void> {
    const appName = this.getAppName();
    const expiryHours = this.configService.getOrThrow<number>('EMAIL_VERIFICATION_EXPIRY_HOURS');
    const expiryTime = this.formatExpiryTime(expiryHours);

    const subject = this.i18nHelper.t('auth.email.verification.subject', { appName });
    const title = this.i18nHelper.t('auth.email.verification.title');
    const buttonText = this.i18nHelper.t('auth.email.verification.button');

    const contentData = {
      greeting: this.i18nHelper.t('auth.email.verification.greeting'),
      body_line1: this.i18nHelper.t('auth.email.verification.body_line1', { appName }),
      body_line2: this.i18nHelper.t('auth.email.verification.body_line2'),
      expiry: this.i18nHelper.t('auth.email.verification.expiry', { expiryTime }),
      fallbackText: this.i18nHelper.t('auth.email.verification.fallbackText'),
      verificationUrl: verificationUrl,
      ignore: this.i18nHelper.t('auth.email.verification.ignore'),
    };

    const baseData = this.getBaseTemplateData(title, buttonText, verificationUrl);
    const html = await this.renderEmail('verification', contentData, baseData);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send password reset email using handlebars template
   */
  async sendPasswordResetEmail(email: string, name: string, resetUrl: string): Promise<void> {
    const appName = this.getAppName();
    const expiryHours = this.configService.getOrThrow<number>('PASSWORD_RESET_EXPIRY_HOURS');
    const expiryTime = this.formatExpiryTime(expiryHours);

    const subject = this.i18nHelper.t('auth.email.password_reset.subject', { appName });
    const title = this.i18nHelper.t('auth.email.password_reset.title');
    const buttonText = this.i18nHelper.t('auth.email.password_reset.button');

    const contentData = {
      greeting: this.i18nHelper.t('auth.email.password_reset.greeting', { name }),
      body: this.i18nHelper.t('auth.email.password_reset.body', { email }),
      expiry: this.i18nHelper.t('auth.email.password_reset.expiry', { expiryTime }),
      ignore: this.i18nHelper.t('auth.email.password_reset.ignore'),
    };

    const baseData = this.getBaseTemplateData(title, buttonText, resetUrl);
    const html = await this.renderEmail('password-reset', contentData, baseData);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send order confirmation email using handlebars template
   */
  async sendOrderConfirmationEmail(
    email: string,
    name: string,
    orderDetails: {
      id: string;
      formName: string;
      entries: number;
      credits: number;
      totalCost: number;
    },
    dashboardUrl: string
  ): Promise<void> {
    const appName = this.getAppName();
    const subject = this.i18nHelper.t('auth.email.order_confirmation.subject', { appName });
    const title = this.i18nHelper.t('auth.email.order_confirmation.title');
    const buttonText = this.i18nHelper.t('auth.email.order_confirmation.button');

    const contentData = {
      greeting: this.i18nHelper.t('auth.email.order_confirmation.greeting', { name }),
      body: this.i18nHelper.t('auth.email.order_confirmation.body'),
      orderDetailsTitle: this.i18nHelper.t('auth.email.order_confirmation.order_details_title'),
      orderIdLabel: this.i18nHelper.t('auth.email.order_confirmation.order_id_label'),
      formLabel: this.i18nHelper.t('auth.email.order_confirmation.form_label'),
      entriesLabel: this.i18nHelper.t('auth.email.order_confirmation.entries_label'),
      creditsLabel: this.i18nHelper.t('auth.email.order_confirmation.credits_label'),
      totalCostLabel: this.i18nHelper.t('auth.email.order_confirmation.total_cost_label'),
      processingMessage: this.i18nHelper.t('auth.email.order_confirmation.processing_message'),
      dashboardMessage: this.i18nHelper.t('auth.email.order_confirmation.dashboard_message'),
      orderId: orderDetails.id,
      formName: orderDetails.formName,
      entries: orderDetails.entries,
      credits: orderDetails.credits,
      totalCost: orderDetails.totalCost.toFixed(2),
    };

    const baseData = this.getBaseTemplateData(title, buttonText, dashboardUrl);
    const html = await this.renderEmail('order-confirmation', contentData, baseData);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  /**
   * Send generic notification email using handlebars template
   */
  async sendNotificationEmail(
    email: string,
    subject: string,
    message: string,
    actionText?: string,
    actionUrl?: string
  ): Promise<void> {
    const contentData = {
      message,
      hasAction: !!(actionText && actionUrl),
      actionDescription: actionText ? `Click the button below to ${actionText.toLowerCase()}.` : '',
    };

    const baseData = this.getBaseTemplateData(subject, actionText, actionUrl);
    const html = await this.renderEmail('generic-notification', contentData, baseData);

    await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
} 