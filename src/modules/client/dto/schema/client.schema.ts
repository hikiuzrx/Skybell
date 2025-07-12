import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Client extends Document {
    @Prop({ required: true, unique: true })
    appName!: string;

    @Prop({ required: true })
    clientSecret!: string;

    @Prop({ required: true })
    clientUrl!: string;
    
    @Prop({ default: true })
    isActive!: boolean;
    
    @Prop({ required: false })
    description?: string;

    @Prop({ required: false })
    cookieName?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);