import { Controller, UsePipes } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { RedisService } from "../../infrsatructure/redis/redis.service";
import { ClientService } from "./client.service";
import { LoggerService } from "../../infrsatructure/logger/logger.service";
import { RegisterClientDto } from "./dto/client.dto";
import type { RegisterClientRequest, RegisterClientResponse } from "../../types/client.type";
import { ClientRegistrationValidationPipe } from "./pipes/client-registration-validation.pipe";
import { FcmTokenRequestValidationPipe } from "./pipes/fcm-token-request-validation.pipe";


@Controller()
export class ClientGrpcService {
  constructor(
    private readonly redisService: RedisService,
    private readonly clientService: ClientService,
    private readonly logger: LoggerService
  ) {}

  @GrpcMethod('ClientRegistrationService', 'RegisterClient')
  @UsePipes(ClientRegistrationValidationPipe)
  async registerClient(data: RegisterClientRequest): Promise<RegisterClientResponse> {
    try {
      const registerDto: RegisterClientDto = {
        appName: data.appName,
        clientSecret: data.clientSecret,
        clientUrl: data.clientUrl,
        description: data.description,
        cookieName: data.cookieName
      };

      const clientId = await this.clientService.addClient(registerDto);

      this.logger.success(
        `Client registered successfully: ${registerDto.appName} (ID: ${clientId})`, 
        'GRPC'
      );

      return { 
        id: clientId,
        success: true, 
        message: 'Client registered successfully' 
      };

    } catch (error: any) {
      this.logger.error(
        `Failed to register client: ${error.message}`,
        error.stack,
        'GRPC'
      );

      if (error.message.includes('already exists')) {
        return { 
          success: false, 
          message: 'A client with this app name already exists' 
        };
      }

      if (error.name === 'BadRequestException') {
        return {
          success: false,
          message: error.message
        };
      }

      return { 
        success: false, 
        message: 'Internal server error occurred during registration' 
      };
    }
  }

  @GrpcMethod('NotificationService', 'RegisterFCMToken')
  @UsePipes(FcmTokenRequestValidationPipe)
  async registerFCMToken(data: { userId: string; clientId: string; fcmToken: string }): Promise<{ success: boolean; message: string }> {
    try {
      await this.redisService.storeFCMToken(data.clientId, data.userId, data.fcmToken);

      this.logger.success(
        `FCM token registered for client ${data.clientId}, user ${data.userId}`, 
        'GRPC'
      );

      return { success: true, message: 'FCM token registered successfully' };

    } catch (error: any) {
      this.logger.error(
        `Failed to register FCM token: ${error.message}`, 
        error.stack, 
        'GRPC'
      );

      if (error.name === 'BadRequestException') {
        return {
          success: false,
          message: error.message
        };
      }

      return { success: false, message: 'Failed to register FCM token' };
    }
  }
}