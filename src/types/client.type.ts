import type { Document } from 'mongoose';
export default interface IClient extends Document {
    appName: string;
    clientSecret: string;
    clientUrl: string;
    isActive: boolean;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    cookieName?: string;
}
