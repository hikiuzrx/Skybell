import { Injectable, BadRequestException } from '@nestjs/common';
import type { PipeTransform } from "@nestjs/common";


interface FcmTokenRequest {
  userId: string;
  clientId: string;
  fcmToken: string;
}

@Injectable()
export class FcmTokenRequestValidationPipe implements PipeTransform {
  transform(value: any): FcmTokenRequest {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid request payload');
    }

    // Check required fields
    if (!value.userId || typeof value.userId !== 'string') {
      throw new BadRequestException('userId is required and must be a string');
    }

    if (!value.clientId || typeof value.clientId !== 'string') {
      throw new BadRequestException('clientId is required and must be a string');
    }

    if (!value.fcmToken || typeof value.fcmToken !== 'string') {
      throw new BadRequestException('fcmToken is required and must be a string');
    }

    // Trim and validate
    const trimmedData = {
      userId: value.userId.trim(),
      clientId: value.clientId.trim(),
      fcmToken: value.fcmToken.trim()
    };

    // Validate FCM token format
    if (trimmedData.fcmToken.length === 0) {
      throw new BadRequestException('FCM token cannot be empty');
    }

    if (/\s/.test(trimmedData.fcmToken)) {
      throw new BadRequestException('FCM token cannot contain whitespace characters');
    }

    return trimmedData;
  }
}