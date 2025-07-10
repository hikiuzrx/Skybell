import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import type  IClient  from "./client.interface";
import { RegisterClientDto } from "./dto/client.dto";
import * as jwt from "jsonwebtoken"
@Injectable()
export class ClientService {
    constructor(@InjectModel("Client") private Client:Model<IClient>){}
    async addClient(data:RegisterClientDto):Promise<string>{
        const existingClient = await this.Client.findOne({appName:data.appName})
        if(existingClient){
            throw new ConflictException("client with this app name already exists")
        }
        const client:IClient = await this.Client.create(data) 
        return (client._id as unknown as string).toString();
    }
    async getClients(){
        return this.Client.find() || [] 
    }
    async validateToken(cookies: Record<string, string|undefined>, clientId: string, token?: string): Promise<any> {
    try {
        let t:string |undefined;
        const client: IClient|null = await this.Client.findById(clientId)
        if(!client){
            throw new UnauthorizedException("client doesn't exist")
        }
        if(token){
             t = token;
        } else {
             t = cookies[client.cookieName || "auth_token"]; 
            if(!t){
                throw new UnauthorizedException("No authentication token provided");
            }
        }
      return jwt.verify(t,client.clientSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}