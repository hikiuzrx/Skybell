export interface INotificationJob {
  users:string[];
  clientId: string;
  payload: {
    title: string;
    body: string;
    actionUrl?:string;
    imageUrl?:string;
    data?: Record<string, any>;
  };
}