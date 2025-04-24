import { Webhook } from '../App';

declare global {
  interface Window {
    api: {
     
      getWebhooks: () => Promise<{ webhooks: Webhook[] }>;
      
      
      saveWebhook: (webhook: { 
        url: string; 
        name: string; 
        avatarUrl?: string 
      }) => Promise<Webhook>;
      
      
      updateWebhook: (webhookId: string, webhookData: Partial<Webhook>) => Promise<Webhook>;
      
      
      updateWebhookUsage: (webhookId: string) => Promise<boolean>;
      
      
      deleteWebhook: (webhookId: string) => Promise<boolean>;
      
      
      sendMessage: (url: string, message: any) => Promise<boolean>;
      
      
      sendMessageWithFiles: (messageData: {
        url: string;
        content?: string;
        username?: string;
        avatar_url?: string;
        embeds?: any[];
        files: any[];
      }) => Promise<boolean>;
    };
  }
}

export {};