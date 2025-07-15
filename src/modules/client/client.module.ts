import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientService } from "./client.service";
import { ClientGrpcService } from "./client.grpc";
import { LoggerModule } from "../../infrsatructure/logger/logger.module";
import RedisModule from "../../infrsatructure/redis/redis.module";
import { Client, ClientSchema } from "./dto/schema/client.schema";
import { 
  ClientRegistrationValidationPipe,
  FcmTokenRequestValidationPipe,
  FcmTokenValidationPipe,
  UrlValidationPipe
} from "./pipes";

@Module({
    imports: [
        LoggerModule,
        RedisModule,
        MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }])
    ],
    providers: [
        ClientService, 
        ClientGrpcService,
        // Register pipes as providers
        ClientRegistrationValidationPipe,
        FcmTokenRequestValidationPipe,
        FcmTokenValidationPipe,
        UrlValidationPipe
    ],
    exports: [
        ClientService, 
        ClientGrpcService,
        // Export pipes for use in other modules
        ClientRegistrationValidationPipe,
        FcmTokenRequestValidationPipe,
        FcmTokenValidationPipe,
        UrlValidationPipe
    ],
})
export class ClientModule {}