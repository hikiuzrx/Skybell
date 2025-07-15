import { Injectable, BadRequestException } from '@nestjs/common';
import type { PipeTransform } from "@nestjs/common";

@Injectable()
export class UrlValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('URL must be a valid string');
    }

    try {
      new URL(value);
      return value.trim();
    } catch {
      throw new BadRequestException('Invalid URL format. Must be a valid URL.');
    }
  }
}