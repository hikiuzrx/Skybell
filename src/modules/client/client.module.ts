import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientService } from "./client.service";
import { LoggerModule } from "../../infrsatructure/logger/logger.module";
import { Client, ClientSchema } from "./dto/schema/client.schema";

@Module({
    imports: [
        LoggerModule,
        MongooseModule.forFeature([{ name: 'Client', schema: ClientSchema }])
    ],
    providers: [ClientService],
    exports: [ClientService],
})
export class ClientModule {}