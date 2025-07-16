import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientService } from "./client.service";
import { ClientRestController } from "./client.controller";
import { ClientGrpcService } from "./client.grpc";
import { LoggerModule } from "../../infrsatructure/logger/logger.module";
import RedisModule from "../../infrsatructure/redis/redis.module";
import { Client, ClientSchema } from "./dto/schema/client.schema";
import { SocketModule } from "../../infrsatructure/socket/socket.module";

@Module({
    imports: [
        LoggerModule,
        RedisModule,
        forwardRef(() => SocketModule), // Use forwardRef to avoid circular dependency
        MongooseModule.forFeature([{ name: Client.name, schema: ClientSchema }])
    ],
    controllers: [ClientRestController, ClientGrpcService],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientModule {}