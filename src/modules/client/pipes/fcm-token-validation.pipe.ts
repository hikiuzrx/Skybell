import { Injectable, BadRequestException } from '@nestjs/common';
import type { PipeTransform } from "@nestjs/common";
@Injectable()
export class FcmTokenValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('FCM token must be a valid string');
    }

    const token = value.trim();
    
    if (token.length === 0) {
      throw new BadRequestException('FCM token cannot be empty');
    }

    if (token !== value) {
      throw new BadRequestException('FCM token cannot contain leading or trailing spaces');
    }

    if (/\s/.test(token)) {
      throw new BadRequestException('FCM token cannot contain whitespace characters');
    }

    return token;
  }
}