export interface INotificationJob {
   userId: string;
  clientId: string;
  payload: {
    title: string;
    body: string;
    data?: Record<string, any>;
  };// Optional field for error messages
}