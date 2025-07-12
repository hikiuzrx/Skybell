import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Client } from "./dto/schema/client.schema";
import { RegisterClientDto } from "./dto/client.dto";
import * as jwt from "jsonwebtoken"

@Injectable()
export class ClientService {
    constructor(@InjectModel(Client.name) private ClientModel: Model<Client>) {}
    async addClient(data: RegisterClientDto): Promise<string> {
        const existingClient = await this.ClientModel.findOne({ appName: data.appName })
        if (existingClient) {
            throw new ConflictException("client with this app name already exists")
        }
        const client: Client = await this.ClientModel.create(data)
        return (client._id as unknown as string).toString();
    }
    async getClients() {
        return this.ClientModel.find() || []
    }
    async getActiveClients(): Promise<Client[]> {
        return this.ClientModel.find({ isActive: true }) || []
    }
    async validateToken(cookies: Record<string, string | undefined>, clientId: string, token?: string): Promise<any> {
        try {
            let t: string | undefined;
            const client: Client | null = await this.ClientModel.findById(clientId)
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