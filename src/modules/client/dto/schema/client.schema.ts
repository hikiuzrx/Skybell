import { Schema,Prop } from "@nestjs/mongoose";
@Schema()
export class Client{
    @Prop({ required: true, unique: true })
    appName!: string;;

    @Prop({ required: true })
    clientSecret!: string;
    
    @Prop({required:true})
    clientUrl!: string;
    @Prop({ default: true })
    isActive!: boolean;
    @Prop({required:false})
    description?: string;

    @Prop({required:false})
    cookieName?:string

    @Prop({ default: Date.now })
    createdAt!: Date;

    @Prop({ default: Date.now })
    updatedAt!: Date;
}