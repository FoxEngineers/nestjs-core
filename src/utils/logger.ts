import { Injectable } from '@nestjs/common';

export interface LogLevel {
  LOG: 'log';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

@Injectable()
export class Logger {
  private context: string;
  private isProduction = process.env.NODE_ENV === 'production';
  private enableSlackLog = process.env.ENABLE_SLACK_LOG === 'true';
  private slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  constructor(context?: string) {
    this.context = context || 'Application';
  }

  log(message: string, context?: string) {
    this.printMessage('log', message, context);
  }

  warn(message: string, context?: string) {
    this.printMessage('warn', message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.printMessage('error', message, context, trace);
  }

  debug(message: string, context?: string) {
    this.printMessage('debug', message, context);
  }

  private printMessage(
    level: 'log' | 'warn' | 'error' | 'debug',
    message: string,
    context?: string,
    trace?: string,
  ) {
    const timestamp = new Date().toISOString();
    const logContext = context || this.context;
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${logContext}] ${message}`;

    // Always log to console in development
    if (!this.isProduction) {
      switch (level) {
        case 'log':
          console.log(logMessage);
          break;
        case 'warn':
          console.warn(logMessage);
          break;
        case 'error':
          console.error(logMessage);
          if (trace) console.error(trace);
          break;
        case 'debug':
          console.debug(logMessage);
          break;
      }
    }

    // Send to Slack in production if enabled
    if (this.isProduction && this.enableSlackLog && this.slackWebhookUrl) {
      this.sendToSlack(level, logMessage, trace);
    }
  }

  private async sendToSlack(
    level: string,
    message: string,
    trace?: string,
  ) {
    if (!this.slackWebhookUrl) {
      return;
    }

    try {
      const color = this.getSlackColor(level);
      const payload = {
        attachments: [
          {
            color,
            title: `🚨 ${level.toUpperCase()} - AutoFillForm`,
            text: message,
            fields: trace
              ? [
                  {
                    title: 'Stack Trace',
                    value: `\`\`\`${trace}\`\`\``,
                    short: false,
                  },
                ]
              : undefined,
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      // Fallback to console if Slack fails
      console.error('Failed to send log to Slack:', error);
      console.error('Original message:', message);
    }
  }

  private getSlackColor(level: string): string {
    switch (level) {
      case 'error':
        return 'danger';
      case 'warn':
        return 'warning';
      case 'log':
        return 'good';
      case 'debug':
        return '#36a64f';
      default:
        return '#36a64f';
    }
  }
} 