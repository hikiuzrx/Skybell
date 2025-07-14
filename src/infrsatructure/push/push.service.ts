import { Injectable } from '@nestjs/common';
import { firebaseAdmin } from '../../config/firebase.config';
import { LoggerService } from '../logger/logger.service';
import type { INotificationJob } from '../../types/notification-job.type';

interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidToken?: boolean;
}

interface MulticastResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  results: PushResult[];
}

@Injectable()
export class PushService {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Send push notification to a single device
   */
  async sendNotification(token: string, payload: Pick<INotificationJob, "payload">): Promise<PushResult> {
    if (!this.validateToken(token)) {
      const error = 'Invalid FCM token format';
      this.logger.error(`❌ ${error}: ${token}`, undefined, 'Push');
      return { success: false, error, invalidToken: true };
    }

    try {
      const message = this.buildMessage(token, payload);
      const response = await firebaseAdmin.messaging().send(message);

      this.logger.success(`Push sent to ${this.maskToken(token)}: ${response}`, 'Push');
      return { success: true, messageId: response };

    } catch (error: any) {
      return this.handlePushError(error, token);
    }
  }

  /**
   * Send push notifications to multiple devices with batch processing
   */
  async sendToMultiple(tokens: string[], payload: Pick<INotificationJob, "payload">): Promise<MulticastResult> {
    if (!tokens.length) {
      this.logger.warn('No tokens provided for multicast push', 'Push');
      return { successCount: 0, failureCount: 0, invalidTokens: [], results: [] };
    }

    // Filter out invalid tokens
    const validTokens = tokens.filter(token => this.validateToken(token));
    const invalidTokens = tokens.filter(token => !this.validateToken(token));

    if (invalidTokens.length > 0) {
      this.logger.warn(`Filtered out ${invalidTokens.length} invalid tokens`, 'Push');
    }

    if (!validTokens.length) {
      this.logger.error('No valid tokens found for multicast push', undefined, 'Push');
      return { successCount: 0, failureCount: tokens.length, invalidTokens, results: [] };
    }

    try {
      const multicastMessage = this.buildMulticastMessage(validTokens, payload);
      const response = await firebaseAdmin.messaging().sendEachForMulticast(multicastMessage);

      const result = this.processMulticastResponse(response, validTokens);
      
      this.logger.success(
        `Push multicast completed: ${result.successCount}/${validTokens.length} successful`,
        'Push'
      );

      // Log failed tokens for debugging
      if (result.failureCount > 0) {
        this.logger.warn(
          `${result.failureCount} push notifications failed. Invalid tokens: ${result.invalidTokens.length}`,
          'Push'
        );
      }

      return {
        ...result,
        invalidTokens: [...invalidTokens, ...result.invalidTokens]
      };

    } catch (error: any) {
      this.logger.error(
        `Multicast push failed: ${error.message}`,
        error.stack,
        'Push'
      );
      return {
        successCount: 0,
        failureCount: validTokens.length,
        invalidTokens,
        results: validTokens.map(() => ({ success: false, error: error.message }))
      };
    }
  }

  /**
   * Send push with retry logic for transient failures
   */
  async sendWithRetry(
    token: string,
    payload: Pick<INotificationJob, "payload">,
    maxRetries: number = 3
  ): Promise<PushResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.sendNotification(token, payload);
        
        if (result.success) {
          if (attempt > 1) {
            this.logger.success(`Push succeeded on attempt ${attempt}`, 'Push');
          }
          return result;
        }

        // Don't retry for invalid tokens or client errors
        if (result.invalidToken || this.isNonRetryableError(result.error)) {
          return result;
        }

        lastError = result.error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          this.logger.warn(`Push attempt ${attempt} failed, retrying in ${delay}ms`, 'Push');
          await this.sleep(delay);
        }

      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          this.logger.warn(`Push attempt ${attempt} failed, retrying in ${delay}ms`, 'Push');
          await this.sleep(delay);
        }
      }
    }

    this.logger.error(`Push failed after ${maxRetries} attempts`, lastError, 'Push');
    return { success: false, error: lastError?.message || 'Max retries exceeded' };
  }

  /**
   * Build Firebase message object
   */
  private buildMessage(token: string, payload: Pick<INotificationJob, "payload">) {
    const message: any = {
      token,
      notification: {
        title: payload.payload.title,
        body: payload.payload.body,
      },
    };

    // Add optional fields only if they exist
    if (payload.payload.imageUrl) {
      message.notification.imageUrl = payload.payload.imageUrl;
    }

    // Build data payload
    const data: Record<string, string> = {};
    
    if (payload.payload.data) {
      // Convert all data values to strings (Firebase requirement)
      Object.entries(payload.payload.data).forEach(([key, value]) => {
        data[key] = String(value);
      });
    }

    if (payload.payload.actionUrl) {
      data.actionUrl = payload.payload.actionUrl;
    }

    if (Object.keys(data).length > 0) {
      message.data = data;
    }

    return message;
  }

  /**
   * Build multicast message object
   */
  private buildMulticastMessage(tokens: string[], payload: Pick<INotificationJob, "payload">) {
    const message: any = {
      tokens,
      notification: {
        title: payload.payload.title,
        body: payload.payload.body,
      },
    };

    if (payload.payload.imageUrl) {
      message.notification.imageUrl = payload.payload.imageUrl;
    }

    const data: Record<string, string> = {};
    
    if (payload.payload.data) {
      Object.entries(payload.payload.data).forEach(([key, value]) => {
        data[key] = String(value);
      });
    }

    if (payload.payload.actionUrl) {
      data.actionUrl = payload.payload.actionUrl;
    }

    if (Object.keys(data).length > 0) {
      message.data = data;
    }

    return message;
  }

  /**
   * Process multicast response and extract results
   */
  private processMulticastResponse(response: any, tokens: string[]): MulticastResult {
    const results: PushResult[] = [];
    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    response.responses.forEach((result: any, index: number) => {
      if (result.success) {
        successCount++;
        results.push({ success: true, messageId: result.messageId });
      } else {
        failureCount++;
        const error = result.error;
        const isInvalidToken = this.isInvalidTokenError(error);
        
        if (isInvalidToken && tokens[index]) {
          invalidTokens.push(tokens[index]);
        }

        results.push({
          success: false,
          error: error.message,
          invalidToken: isInvalidToken
        });

        this.logger.error(
          `Push failed for token ${this.maskToken(tokens[index] ?? '')}: ${error.message}`,
          undefined,
          'Push'
        );
      }
    });

    return { successCount, failureCount, invalidTokens, results };
  }

  /**
   * Handle push notification errors
   */
  private handlePushError(error: any, token: string): PushResult {
    const isInvalidToken = this.isInvalidTokenError(error);
    
    if (isInvalidToken) {
      this.logger.warn(`Invalid FCM token: ${this.maskToken(token)}`, 'Push');
    } else {
      this.logger.error(
        `Push notification failed for ${this.maskToken(token)}: ${error.message}`,
        error.stack,
        'Push'
      );
    }

    return {
      success: false,
      error: error.message,
      invalidToken: isInvalidToken
    };
  }

  /**
   * Check if error indicates invalid token
   */
  private isInvalidTokenError(error: any): boolean {
    const invalidTokenCodes = [
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/invalid-argument'
    ];
    
    return error?.code && invalidTokenCodes.includes(error.code);
  }

  /**
   * Check if error should not be retried
   */
  private isNonRetryableError(error?: string): boolean {
    if (!error) return false;
    
    const nonRetryableErrors = [
      'messaging/invalid-argument',
      'messaging/invalid-registration-token',
      'messaging/registration-token-not-registered',
      'messaging/message-rate-exceeded'
    ];
    
    return nonRetryableErrors.some(code => error.includes(code));
  }

  /**
   * Validate FCM token format
   */
  private validateToken(token: string): boolean {
    return typeof token === 'string' && 
           token.length > 0 && 
           token.trim() === token && 
           !/\s/.test(token);
  }

  /**
   * Mask token for logging (show first 8 and last 4 characters)
   */
  private maskToken(token: string): string {
    if (token.length <= 12) return '***';
    return `${token.substring(0, 8)}...${token.substring(token.length - 4)}`;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get push service health status
   */
  async getHealthStatus(): Promise<{ status: string; timestamp: string }> {
    try {
      // Test Firebase connection by getting app info
      const app = firebaseAdmin.app();
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.logger.error('Push service health check failed', error.stack, 'Push');
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}
