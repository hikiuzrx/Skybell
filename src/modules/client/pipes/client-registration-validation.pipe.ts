import { Injectable, BadRequestException } from '@nestjs/common';
import type { PipeTransform } from "@nestjs/common";
import type { RegisterClientRequest } from '../../../types/client.type';

@Injectable()
export class ClientRegistrationValidationPipe implements PipeTransform {
  transform(value: RegisterClientRequest): RegisterClientRequest {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid request payload');
    }

    // Check required fields
    if (!value.appName || typeof value.appName !== 'string') {
      throw new BadRequestException('appName is required and must be a string');
    }

    if (!value.clientSecret || typeof value.clientSecret !== 'string') {
      throw new BadRequestException('clientSecret is required and must be a string');
    }

    if (!value.clientUrl || typeof value.clientUrl !== 'string') {
      throw new BadRequestException('clientUrl is required and must be a string');
    }

    // Trim values
    const trimmedData = {
      appName: value.appName.trim(),
      clientSecret: value.clientSecret.trim(),
      clientUrl: value.clientUrl.trim(),
      description: value.description?.trim(),
      cookieName: value.cookieName?.trim()
    };

    // Validate lengths
    if (trimmedData.appName.length < 3) {
      throw new BadRequestException('App name must be at least 3 characters long');
    }

    if (trimmedData.clientSecret.length < 8) {
      throw new BadRequestException('Client secret must be at least 8 characters long');
    }

    // Validate URL format
    try {
      new URL(trimmedData.clientUrl);
    } catch {
      throw new BadRequestException('Invalid clientUrl format. Must be a valid URL.');
    }

    return trimmedData;
  }
}