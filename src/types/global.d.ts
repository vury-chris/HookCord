import { DiscordMessage } from '../components/EmbedCreator/EmbedCreator';

// Global type declarations
declare global {
  interface Window {
    api: {
      // Get webhooks from storage
      getWebhooks: () => Promise<{ webhooks: any[] }>;
      
      // Save a webhook to storage
      saveWebhook: (webhook: { 
        url: string; 
        name: string; 
        avatarUrl?: string 
      }) => Promise<any>;
      
      // Update last used timestamp for a webhook
      updateWebhookUsage: (webhookId: string) => Promise<boolean>;
      
      // Delete a webhook from storage
      deleteWebhook: (webhookId: string) => Promise<boolean>;
      
      // Send a message via webhook (without files)
      sendMessage: (url: string, message: DiscordMessage) => Promise<boolean>;
      
      // Send a message with files via webhook
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

// This empty export is needed to make this a module
export {};