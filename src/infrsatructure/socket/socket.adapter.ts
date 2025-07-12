import { Injectable, UnauthorizedException } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import type { ClientService } from "../../modules/client/client.service";
import type { Server,ServerOptions,Socket } from "socket.io";
import type { LoggerService } from "../logger/logger.service";
import * as cookie from "cookie";

@Injectable()
export class AuthenticatedSocketAdapter extends IoAdapter {
    private allowedOrigins:string[] = [];
    constructor(
        private readonly clientService:ClientService,
        private readonly logger:LoggerService,
    ){
        super();
    }
    setAllowedOrigins(origins: string[]) {
        this.logger.log(`Setting allowed origins for sockets: ${origins.join(', ')}`);
        this.allowedOrigins = origins;

    }
    create(port:number,options:ServerOptions):Server{
        options.cors ={
            credentials:true,
        }
        options.transports = ['websocket', 'polling'];
        const server =super.create(port,options);
        server.use(async(socket:Socket,next)=>{
          try{
             const {clientId,token} = socket.handshake.auth;
            if (!token) {
                const cookieHeader = socket.handshake.headers.cookie;
                if (!cookieHeader) {
                    this.logger.log("no auth proof provided");
                    return next(new Error('Unauthorized: No authentication proof provided.'));
                }
                const cookies = cookie.parse(cookieHeader);
                await this.clientService.validateToken(cookies, clientId);
            }
            const user = await this.clientService.validateToken(clientId,token);
            this.logger.log(`Authenticated handshake from user ${clientId} with socket ID ${socket.id}`);
            socket.data.user =user ;
            socket.data.clientId = clientId; 
            next(); 
          }catch(e:any){
            this.logger.error(`Authentication error: ${e.message}`);
            next(new UnauthorizedException(`Authentication error: ${e.message}`));
          }
        })
        return server;
    }
}