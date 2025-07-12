export interface INotificationJob {
   userId: string;
  clientId: string;
  payload: {
    title: string;
    body: string;
    actionUrl?:string;
    imageUrl?:string;
    data?: Record<string, any>;
  };
}