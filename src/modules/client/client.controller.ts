import { Controller, Post, Body, HttpStatus, HttpException, Get, Inject, forwardRef } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RedisService } from "../../infrsatructure/redis/redis.service";
import { ClientService } from "./client.service";
import { LoggerService } from "../../infrsatructure/logger/logger.service";
import { RegisterClientDto } from "./dto/client.dto";
import type { RegisterClientRequest, RegisterClientResponse, GetClientsResponse, ClientInfo } from "../../types/client.type";
import { ClientRegistrationValidationPipe } from "./pipes/client-registration-validation.pipe";
import { FcmTokenRequestValidationPipe } from "./pipes/fcm-token-request-validation.pipe";
import { AuthenticatedSocketAdapter } from "../../infrsatructure/socket/socket.adapter";

@ApiTags('Client Management')
@Controller('api/v1/clients')
export class ClientRestController {
  constructor(
    private readonly redisService: RedisService,
    private readonly clientService: ClientService,
    private readonly logger: LoggerService,
    private readonly socketAdapter: AuthenticatedSocketAdapter
  ) {}

  @Post('register')
  @ApiOperation({ 
    summary: 'Register a new client application',
    description: 'Register a new client application with app name, secret, and URL'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Client registered successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439011' },
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Client registered successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'App name must be at least 3 characters long' }
      }
    }
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - client already exists',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'A client with this app name already exists' }
      }
    }
  })
  @ApiBody({
    description: 'Client registration data',
    schema: {
      type: 'object',
      required: ['appName', 'clientSecret', 'clientUrl'],
      properties: {
        appName: { type: 'string', example: 'my-awesome-app', minLength: 3 },
        clientSecret: { type: 'string', example: 'super-secret-key-123', minLength: 8 },
        clientUrl: { type: 'string', example: 'https://myapp.com', format: 'uri' },
        description: { type: 'string', example: 'My awesome application' },
        cookieName: { type: 'string', example: 'auth_token' }
      }
    }
  })
  async registerClient(
    @Body(ClientRegistrationValidationPipe) data: RegisterClientRequest
  ): Promise<RegisterClientResponse> {
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
        `Client registered successfully via REST: ${registerDto.appName} (ID: ${clientId})`, 
        'REST'
      );

      return { 
        id: clientId,
        success: true, 
        message: 'Client registered successfully' 
      };

    } catch (error: any) {
      this.logger.error(
        `Failed to register client via REST: ${error.message}`,
        error.stack,
        'REST'
      );

      if (error.message.includes('already exists')) {
        throw new HttpException(
          { success: false, message: 'A client with this app name already exists' },
          HttpStatus.CONFLICT
        );
      }

      if (error.name === 'BadRequestException') {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        { success: false, message: 'Internal server error occurred during registration' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fcm-token')
  @ApiOperation({ 
    summary: 'Register FCM token for push notifications',
    description: 'Register an FCM token for a specific user and client to enable push notifications'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'FCM token registered successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'FCM token registered successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'FCM token cannot be empty' }
      }
    }
  })
  @ApiBody({
    description: 'FCM token registration data',
    schema: {
      type: 'object',
      required: ['userId', 'clientId', 'fcmToken'],
      properties: {
        userId: { type: 'string', example: 'user123' },
        clientId: { type: 'string', example: '507f1f77bcf86cd799439011' },
        fcmToken: { type: 'string', example: 'fGzY8H7jQR...' }
      }
    }
  })
  async registerFCMToken(
    @Body(FcmTokenRequestValidationPipe) data: { userId: string; clientId: string; fcmToken: string }
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.redisService.storeFCMToken(data.clientId, data.userId, data.fcmToken);

      this.logger.success(
        `FCM token registered via REST for client ${data.clientId}, user ${data.userId}`, 
        'REST'
      );

      return { success: true, message: 'FCM token registered successfully' };

    } catch (error: any) {
      this.logger.error(
        `Failed to register FCM token via REST: ${error.message}`, 
        error.stack, 
        'REST'
      );

      if (error.name === 'BadRequestException') {
        throw new HttpException(
          { success: false, message: error.message },
          HttpStatus.BAD_REQUEST
        );
      }

      throw new HttpException(
        { success: false, message: 'Failed to register FCM token' },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all registered clients',
    description: 'Retrieve a list of all registered client applications'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Clients retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Clients retrieved successfully' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '507f1f77bcf86cd799439011' },
              appName: { type: 'string', example: 'my-awesome-app' },
              clientUrl: { type: 'string', example: 'https://myapp.com' },
              isActive: { type: 'boolean', example: true },
              description: { type: 'string', example: 'My awesome application' },
              cookieName: { type: 'string', example: 'auth_token' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Failed to retrieve clients' }
      }
    }
  })
  async getAllClients(): Promise<GetClientsResponse> {
    try {
      const clients = await this.clientService.getClients();

      this.logger.log(`Retrieved ${clients.length} clients via REST`, 'REST');

      const clientData: ClientInfo[] = clients.map(client => ({
        id: client._id.toString(),
        appName: client.appName,
        clientUrl: client.clientUrl,
        isActive: client.isActive,
        description: client.description,
        cookieName: client.cookieName,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }));

      return {
        success: true,
        message: 'Clients retrieved successfully',
        data: clientData
      };

    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve clients via REST: ${error.message}`,
        error.stack,
        'REST'
      );

      throw new HttpException(
        { 
          success: false, 
          message: 'Failed to retrieve clients',
          data: []
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('refresh-socket-origins')
  @ApiOperation({ 
    summary: 'Refresh Socket.IO allowed origins',
    description: 'Refresh the allowed origins for Socket.IO connections based on active client URLs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Origins refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        origins: { type: 'array', items: { type: 'string' }, example: ['https://app1.com', 'https://app2.com'] },
        count: { type: 'number', example: 2 }
      }
    }
  })
  async refreshSocketOrigins() {
    try {
      const origins = await this.socketAdapter.refreshAllowedOrigins();
      
      this.logger.success(`Refreshed Socket.IO allowed origins: [${origins.join(', ')}]`, 'REST');
      
      return { 
        success: true, 
        origins,
        count: origins.length
      };
    } catch (error) {
      this.logger.error(`Failed to refresh socket origins: ${error.message}`, error.stack, 'REST');
      throw new HttpException({
        success: false,
        message: 'Failed to refresh socket origins'
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

@ApiTags('clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of all clients' })
  async getAllClients() {
    try {
      const clients = await this.clientService.getClients();
      return {
        success: true,
        message: 'Clients fetched successfully',
        data: clients
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch clients',
        error: error.message
      };
    }
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active clients' })
  @ApiResponse({ status: 200, description: 'List of active clients' })
  async getActiveClients() {
    try {
      const clients = await this.clientService.getActiveClients();
      return {
        success: true,
        message: 'Active clients fetched successfully',
        data: clients
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to fetch active clients',
        error: error.message
      };
    }
  }
}