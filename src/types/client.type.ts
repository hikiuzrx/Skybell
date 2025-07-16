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
export interface RegisterClientRequest {
  appName: string;
  clientSecret: string;
  clientUrl: string;
  description?: string;
  cookieName?: string;
}

export interface RegisterClientResponse {
  id?: string;
  success: boolean;
  message: string;
}

export interface RegisterFCMTokenRequest {
  userId: string;
  clientId: string;
  fcmToken: string;
}

export interface RegisterFCMTokenResponse {
  success: boolean;
  message: string;
}

export interface ClientInfo {
  id: string;
  appName: string;
  clientUrl: string;
  isActive: boolean;
  description?: string;
  cookieName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetClientsResponse {
  success: boolean;
  message: string;
  data: ClientInfo[];
}